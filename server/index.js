import express from "express";
import cors from "cors";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const YOUTUBE_URL_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;
const AUDIO_QUALITIES = [128, 192, 256];

function isValidYoutubeUrl(url) {
  return typeof url === "string" && YOUTUBE_URL_RE.test(url);
}

export function createApp({ ytdlpPath = "yt-dlp", denoPath, ffmpegPath, clientDist } = {}) {
  const app = express();
  app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
  app.use(express.json());

  const jsRuntimeArgs = denoPath ? ["--js-runtimes", `deno:${denoPath}`] : [];
  const ffmpegArgs = ffmpegPath ? ["--ffmpeg-location", ffmpegPath] : [];

  // jobId -> { status: 'downloading'|'done'|'error', percent, filePath, ext, error }
  const jobs = new Map();

  app.post("/api/info", (req, res) => {
    const { url } = req.body || {};
    if (!isValidYoutubeUrl(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const infoArgs = ["-j", "--no-playlist", ...jsRuntimeArgs, ...ffmpegArgs, url];
    execFile(ytdlpPath, infoArgs, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch video info", detail: err.message });
      }
      let data;
      try {
        data = JSON.parse(stdout);
      } catch {
        return res.status(500).json({ error: "Failed to parse video info" });
      }

      const dedupe = (list, keyFn) => {
        const seen = new Set();
        return list.filter((f) => {
          const key = keyFn(f);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      const toEntry = (f) => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution,
        note: f.format_note || "",
        vcodec: f.vcodec,
        acodec: f.acodec,
        filesize: f.filesize || f.filesize_approx || null,
      });

      const all = (data.formats || []).filter((f) => f.url && f.filesize);

      const formats = dedupe(
        all.filter((f) => f.vcodec !== "none" && f.ext === "mp4"),
        (f) => f.resolution
      )
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map(toEntry);

      const audioFormats = AUDIO_QUALITIES.map((kbps) => ({
        bitrate: kbps,
        ext: "mp3",
        filesize: data.duration ? Math.round((kbps * 1000 * data.duration) / 8) : null,
      }));

      res.json({
        title: data.title,
        channel: data.channel || data.uploader,
        thumbnail: data.thumbnail,
        duration: data.duration,
        view_count: data.view_count,
        upload_date: data.upload_date,
        formats,
        audioFormats,
      });
    });
  });

  app.post("/api/download/start", (req, res) => {
    const { url, format_id: formatId, audio_only: audioOnly, bitrate } = req.body || {};
    if (!isValidYoutubeUrl(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }
    const isAudio = audioOnly === true || audioOnly === "1";
    if (!isAudio && (typeof formatId !== "string" || !/^[\w+-]+$/.test(formatId))) {
      return res.status(400).json({ error: "Invalid format_id" });
    }
    if (isAudio && !AUDIO_QUALITIES.includes(Number(bitrate))) {
      return res.status(400).json({ error: "Invalid bitrate" });
    }

    const jobId = crypto.randomUUID();
    const tmpDir = os.tmpdir();
    const tmpBase = path.join(tmpDir, `ytbot-${jobId}`);
    const outTemplate = `${tmpBase}.%(ext)s`;

    const args = isAudio
      ? [
          "-f",
          "bestaudio",
          "--no-playlist",
          "-x",
          "--audio-format",
          "mp3",
          "--audio-quality",
          `${bitrate}K`,
          "--embed-thumbnail",
          "--newline",
          ...jsRuntimeArgs,
          ...ffmpegArgs,
          "-o",
          outTemplate,
          url,
        ]
      : [
          "-f",
          `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best`,
          "--no-playlist",
          "--merge-output-format",
          "mp4",
          "--embed-thumbnail",
          "--newline",
          ...jsRuntimeArgs,
          ...ffmpegArgs,
          "-o",
          outTemplate,
          url,
        ];

    const job = { status: "downloading", percent: 0, filePath: null, ext: isAudio ? "mp3" : "mp4", error: null };
    jobs.set(jobId, job);

    const child = spawn(ytdlpPath, args);
    let stderr = "";

    child.stdout.on("data", (d) => {
      const m = d.toString().match(/\[download\]\s+([\d.]+)%/);
      if (m) job.percent = Math.min(99, Math.round(parseFloat(m[1])));
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });

    child.on("error", (err) => {
      job.status = "error";
      job.error = err.message;
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error("yt-dlp error:", stderr);
        job.status = "error";
        job.error = stderr.slice(-2000) || "Download failed";
        return;
      }
      const files = fs.readdirSync(tmpDir).filter((f) => f.startsWith(path.basename(tmpBase)));
      const outFile = files[0] && path.join(tmpDir, files[0]);
      if (!outFile || !fs.existsSync(outFile)) {
        job.status = "error";
        job.error = "Output file not found";
        return;
      }
      job.filePath = outFile;
      job.ext = path.extname(outFile).slice(1) || job.ext;
      job.percent = 100;
      job.status = "done";
    });

    res.json({ jobId });
  });

  app.get("/api/download/progress/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ status: job.status, percent: job.percent, error: job.error || undefined });
  });

  app.get("/api/download/file/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || job.status !== "done" || !job.filePath || !fs.existsSync(job.filePath)) {
      return res.status(404).json({ error: "File not ready" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="download.${job.ext}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", fs.statSync(job.filePath).size);

    const stream = fs.createReadStream(job.filePath);
    stream.pipe(res);
    const cleanup = () => {
      fs.unlink(job.filePath, () => {});
      jobs.delete(req.params.jobId);
    };
    stream.on("close", cleanup);
    stream.on("error", cleanup);
  });

  if (clientDist && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/.*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
  }

  return app;
}

export function startServer(opts = {}) {
  const app = createApp(opts);
  const port = opts.port || process.env.PORT || 3001;
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`ytbot-server listening on :${port}`);
      resolve({ port, server });
    });
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.slice(1));
if (isMain) {
  startServer({
    ytdlpPath: process.env.YTDLP_PATH || "yt-dlp",
    denoPath: process.env.DENO_PATH || "deno",
    ffmpegPath: process.env.FFMPEG_PATH,
    clientDist: process.env.CLIENT_DIST,
  });
}
