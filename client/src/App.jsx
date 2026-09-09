import { useState } from "react";
import "./App.css";

const API = "http://localhost:3001";
const YOUTUBE_URL_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;

function formatSize(bytes) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDuration(sec) {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n) {
  if (!n) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function formatUploadDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "—";
  const y = yyyymmdd.slice(0, 4);
  const mo = Number(yyyymmdd.slice(4, 6)) - 1;
  const d = yyyymmdd.slice(6, 8);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[mo]} ${d}, ${y}`;
}

function bestQuality(formats) {
  if (!formats?.length) return "—";
  const heights = formats.map((f) => parseInt(f.resolution?.split("x")[1] || "0", 10));
  const max = Math.max(...heights);
  if (max >= 4320) return "8K";
  if (max >= 2160) return "4K";
  if (max >= 1440) return "2K";
  return max ? `${max}p` : "—";
}

function tabBtn(active) {
  return `flex-1 px-3 py-1.5 font-semibold rounded transition text-xs flex items-center justify-center gap-1.5 ${
    active ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
  }`;
}

function DownloadPicker({ options, dPrefix, downloads, onDownload }) {
  const [selected, setSelected] = useState(options[0]?.key || "");
  const opt = options.find((o) => o.key === selected) || options[0];
  const progress = opt ? downloads[`${dPrefix}::${opt.key}`] : undefined;
  const isDownloading = progress !== undefined;
  const isAudio = opt?.key?.startsWith("a-");
  const isProcessing = isDownloading && isAudio && progress >= 90;

  if (!options.length) return <p className="text-zinc-500 text-xs">Tidak ada format.</p>;

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full appearance-none bg-zinc-900/60 border border-zinc-700/50 hover:border-red-600/40 rounded px-3 py-2.5 pr-9 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key} className="bg-zinc-900 text-white">
              {o.label}
            </option>
          ))}
        </select>
        <i className="fas fa-chevron-down text-zinc-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {isDownloading && (
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          {isProcessing ? (
            <div className="h-full w-1/3 bg-red-600 animate-pulse rounded-full" />
          ) : (
            <div className="h-full bg-red-600 transition-all" style={{ width: `${progress}%` }} />
          )}
        </div>
      )}
      <button
        disabled={isDownloading || !opt}
        onClick={() => onDownload(opt)}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold transition text-sm flex items-center justify-center gap-2"
      >
        <i className={`fas ${isProcessing ? "fa-spinner fa-spin" : "fa-download"} text-xs`} />
        {isProcessing ? "Memproses..." : isDownloading ? `Downloading ${progress}%` : "Download"}
      </button>
    </div>
  );
}

function VideoCard({ video, downloads, setTab, onDownload }) {
  const { url, data, tab, error, loading } = video;

  if (loading) {
    return (
      <div className="glass rounded-lg p-6 glow-red fade-in flex items-center gap-3 text-zinc-400 text-sm min-h-[120px]">
        <i className="fas fa-spinner fa-spin" />
        <span className="truncate">{url}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-lg p-4 fade-in">
        <p className="text-zinc-500 text-xs mb-1 truncate">{url}</p>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const videoOptions = data.formats.map((f) => ({
    key: `v-${f.format_id}`,
    label: `${f.resolution} · ${f.ext.toUpperCase()} · ${formatSize(f.filesize)}`,
    body: { format_id: f.format_id },
  }));
  const audioOptions = data.audioFormats.map((f) => ({
    key: `a-${f.bitrate}`,
    label: `MP3 · ${f.bitrate} kbps · ~${formatSize(f.filesize)}`,
    body: { audio_only: true, bitrate: f.bitrate },
  }));

  return (
    <div className="glass rounded-lg overflow-hidden glow-red fade-in slide-down flex flex-col">
      <div className="relative bg-black h-48 overflow-hidden group shrink-0">
        {data.thumbnail && (
          <img
            src={data.thumbnail}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            onError={(e) => {
              if (!e.target.dataset.fallback) {
                e.target.dataset.fallback = "1";
                e.target.src = data.thumbnail.replace(/maxresdefault|sddefault/, "hqdefault");
              }
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h2 className="text-sm font-bold line-clamp-2 mb-1 text-white">{data.title}</h2>
          <span className="bg-red-600 px-2 py-0.5 rounded text-[10px] font-semibold">
            {formatDuration(data.duration)}
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-zinc-800/50 rounded p-1.5 text-center">
            <p className="text-zinc-400 text-[10px]">Views</p>
            <p className="text-xs font-bold text-red-400">{formatViews(data.view_count)}</p>
          </div>
          <div className="bg-zinc-800/50 rounded p-1.5 text-center">
            <p className="text-zinc-400 text-[10px]">Upload</p>
            <p className="text-xs font-bold text-red-400 truncate">{formatUploadDate(data.upload_date)}</p>
          </div>
          <div className="bg-zinc-800/50 rounded p-1.5 text-center">
            <p className="text-zinc-400 text-[10px]">Quality</p>
            <p className="text-xs font-bold text-red-400">{bestQuality(data.formats)}</p>
          </div>
        </div>

        <div className="flex gap-1 bg-zinc-800/40 p-1 rounded">
          <button className={tabBtn(tab === "video")} onClick={() => setTab(url, "video")}>
            <i className="fas fa-film" />
            Video
          </button>
          <button className={tabBtn(tab === "audio")} onClick={() => setTab(url, "audio")}>
            <i className="fas fa-music" />
            Audio
          </button>
        </div>

        {tab === "video" ? (
          <DownloadPicker
            options={videoOptions}
            dPrefix={url}
            downloads={downloads}
            onDownload={(opt) => onDownload(url, data, opt.key, opt.body)}
          />
        ) : (
          <DownloadPicker
            options={audioOptions}
            dPrefix={url}
            downloads={downloads}
            onDownload={(opt) => onDownload(url, data, opt.key, opt.body)}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [urlText, setUrlText] = useState("");
  const [pendingUrls, setPendingUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [videos, setVideos] = useState([]); // [{ url, data, tab, error, loading }]
  const [downloads, setDownloads] = useState({}); // { "url::key": progress }

  function addUrls(text) {
    const found = text.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
    if (!found.length) return;
    const invalid = found.filter((u) => !YOUTUBE_URL_RE.test(u));
    if (invalid.length) {
      setFormError(`URL bukan YouTube: ${invalid[0]}`);
      return;
    }
    setFormError("");
    setPendingUrls((prev) => [...new Set([...prev, ...found])]);
  }

  function removeUrl(url) {
    setPendingUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleCheck(e) {
    e.preventDefault();
    let urls = pendingUrls;
    if (urlText.trim()) {
      const found = urlText.trim().split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
      const invalid = found.filter((u) => !YOUTUBE_URL_RE.test(u));
      if (invalid.length) {
        setFormError(`URL bukan YouTube: ${invalid[0]}`);
        return;
      }
      urls = [...new Set([...pendingUrls, ...found])];
      setPendingUrls(urls);
    }
    setUrlText("");
    if (!urls.length) return;
    setFormError("");

    setLoading(true);
    setVideos(urls.map((url) => ({ url, data: null, tab: "video", error: null, loading: true })));

    await Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(`${API}/api/info`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed");
          setVideos((vs) => vs.map((v) => (v.url === url ? { ...v, data, loading: false } : v)));
        } catch (err) {
          setVideos((vs) => vs.map((v) => (v.url === url ? { ...v, error: err.message, loading: false } : v)));
        }
      })
    );
    setLoading(false);
  }

  function setTab(url, tab) {
    setVideos((vs) => vs.map((v) => (v.url === url ? { ...v, tab } : v)));
  }

  async function handleDownload(url, data, formatKey, body) {
    const dKey = `${url}::${formatKey}`;
    setDownloads((d) => ({ ...d, [dKey]: 0 }));
    try {
      const startRes = await fetch(`${API}/api/download/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...body }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || "Download failed");
      const { jobId } = startData;

      let status, percent;
      while (true) {
        await new Promise((r) => setTimeout(r, 500));
        const pRes = await fetch(`${API}/api/download/progress/${jobId}`);
        const pData = await pRes.json();
        if (!pRes.ok) throw new Error(pData.error || "Download failed");
        status = pData.status;
        percent = pData.percent;
        setDownloads((d) => ({ ...d, [dKey]: percent }));
        if (status === "done" || status === "error") {
          if (status === "error") throw new Error(pData.error || "Download failed");
          break;
        }
      }

      const fileRes = await fetch(`${API}/api/download/file/${jobId}`);
      if (!fileRes.ok) throw new Error("Download failed");
      const ext = fileRes.headers.get("Content-Disposition")?.match(/\.(\w+)"/)?.[1] || "mp4";
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${data.title || "download"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setDownloads((d) => {
        const { [dKey]: _, ...rest } = d;
        return rest;
      });
    }
  }

  return (
    <div className="animated-bg text-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold mb-2 text-white">
            <span className="text-red-500">YouTube</span> Downloader
          </h1>
          <p className="text-zinc-400 text-sm">Download video 4K &amp; audio MP3 instan — bisa multi link sekaligus</p>
        </div>

        <form onSubmit={handleCheck} className="mb-8 fade-in max-w-3xl mx-auto" style={{ animationDelay: "0.05s" }}>
          <div className="glass rounded-lg p-4 glow-red flex flex-col gap-2">
            {pendingUrls.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pendingUrls.map((u) => (
                  <span
                    key={u}
                    className="flex items-center gap-1.5 bg-zinc-800/70 border border-zinc-700/50 rounded-full pl-3 pr-1.5 py-1 text-xs text-zinc-300 max-w-full"
                  >
                    <span className="truncate max-w-[220px]">{u}</span>
                    <button
                      type="button"
                      onClick={() => removeUrl(u)}
                      className="w-4 h-4 flex items-center justify-center rounded-full bg-zinc-700/60 hover:bg-red-600 text-zinc-300 hover:text-white transition shrink-0"
                    >
                      <i className="fas fa-xmark text-[9px]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text").trim();
                if (!pasted) return;
                e.preventDefault();
                addUrls(pasted);
              }}
              placeholder={pendingUrls.length ? "Paste link lagi..." : "Paste URL... (bisa paste berkali-kali)"}
              required={pendingUrls.length === 0}
              rows={1}
              className="w-full resize-none bg-zinc-900/60 border border-zinc-700/40 rounded px-3 py-2 text-white placeholder-zinc-500/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded font-semibold transition text-sm flex items-center justify-center gap-1.5"
            >
              <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-search"} text-xs`} />
              {loading ? "..." : "Get"}
            </button>
            {formError && <p className="text-red-400 text-xs">{formError}</p>}
          </div>
        </form>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.url}
                video={video}
                downloads={downloads}
                setTab={setTab}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 text-red-600/20">
              <i className="fas fa-circle-play" />
            </div>
            <p className="text-zinc-400 text-sm">Masukkan link untuk mulai download</p>
          </div>
        )}
      </div>
    </div>
  );
}
