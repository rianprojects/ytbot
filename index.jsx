import React, { useState } from 'react';

const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('video');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const mockVideoData = {
    title: 'Contoh Video YouTube - Tutorial Download',
    channel: 'Channel Name',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '3:32',
    views: '1.2M',
    uploadDate: 'Jan 15, 2024',
    formats: {
      video: [
        { resolution: '1080p', fps: '60', size: '250 MB', codec: 'h.264', bitrate: '5 Mbps' },
        { resolution: '1080p', fps: '30', size: '180 MB', codec: 'h.264', bitrate: '3.5 Mbps' },
        { resolution: '720p', fps: '60', size: '120 MB', codec: 'h.264', bitrate: '2.5 Mbps' },
        { resolution: '720p', fps: '30', size: '85 MB', codec: 'h.264', bitrate: '1.8 Mbps' },
        { resolution: '480p', fps: '30', size: '45 MB', codec: 'h.264', bitrate: '1 Mbps' },
        { resolution: '360p', fps: '30', size: '25 MB', codec: 'h.264', bitrate: '0.6 Mbps' },
      ],
      audio: [
        { bitrate: '320 kbps', format: 'MP3', size: '8.5 MB' },
        { bitrate: '256 kbps', format: 'MP3', size: '6.8 MB' },
        { bitrate: '192 kbps', format: 'MP3', size: '5.1 MB' },
        { bitrate: '128 kbps', format: 'MP3', size: '3.4 MB' },
      ],
    },
  };

  const handleFetchVideo = async () => {
    if (!url.trim()) {
      alert('Masukkan URL');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setVideoInfo(mockVideoData);
      setLoading(false);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleFetchVideo();
  };

  const FormatCard = ({ format, isAudio }) => (
    <div className="bg-zinc-800/50 hover:bg-zinc-800/70 border border-zinc-700/50 hover:border-red-600/40 rounded p-3 flex justify-between items-center cursor-pointer transition" style={{ animation: 'slideDown 0.25s ease-out' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded text-xs font-semibold">
            {isAudio ? format.format : format.resolution}
          </span>
          <span className="text-white text-xs font-medium">
            {isAudio ? format.bitrate : `${format.fps}fps`}
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          {isAudio ? format.size : `${format.codec} • ${format.bitrate} • ${format.size}`}
        </p>
      </div>
      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded font-semibold transition text-xs ml-3 whitespace-nowrap flex items-center gap-1">
        <i className="fas fa-download text-xs"></i>Get
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-red-950/20 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: scaleY(0); }
          to { opacity: 1; transform: scaleY(1); }
        }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .slide-down { animation: slideDown 0.25s ease-out; transform-origin: top; }
        .glass {
          background: rgba(24, 24, 27, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(113, 113, 122, 0.15);
        }
        .glow-red { box-shadow: 0 0 15px rgba(220, 38, 38, 0.25); }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold mb-2 text-white">
            <span className="text-red-500">YouTube</span> Downloader
          </h1>
          <p className="text-zinc-400 text-sm">Download video 4K & audio MP3 instan</p>
        </div>

        {/* Input Section */}
        <div className="mb-8 fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="glass rounded-lg p-4 glow-red">
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Paste URL..."
                className="flex-1 bg-zinc-900/60 border border-zinc-700/40 rounded px-3 py-2 text-white placeholder-zinc-500/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition text-sm"
              />
              <button
                onClick={handleFetchVideo}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-700/50 text-white px-6 py-2 rounded font-semibold transition text-sm flex items-center gap-1.5"
              >
                <i className="fas fa-search text-xs"></i>
                {loading ? 'Loading...' : 'Get'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {videoInfo ? (
          <div className="glass rounded-lg overflow-hidden mb-6 glow-red fade-in slide-down">
            {/* Thumbnail */}
            <div className="relative bg-black h-56 overflow-hidden group">
              <img
                src={videoInfo.thumbnail}
                alt="Thumbnail"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-lg font-bold line-clamp-2 mb-1 text-white">{videoInfo.title}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-zinc-300 text-xs font-medium">{videoInfo.channel}</p>
                  <span className="bg-red-600 px-2 py-0.5 rounded text-xs font-semibold">{videoInfo.duration}</span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-zinc-800/50 rounded p-2 text-center">
                  <p className="text-zinc-400 text-xs">Views</p>
                  <p className="text-sm font-bold text-red-400 mt-0.5">{videoInfo.views}</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-2 text-center">
                  <p className="text-zinc-400 text-xs">Upload</p>
                  <p className="text-sm font-bold text-red-400 mt-0.5">{videoInfo.uploadDate}</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-2 text-center">
                  <p className="text-zinc-400 text-xs">Quality</p>
                  <p className="text-sm font-bold text-red-400 mt-0.5">8K</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-zinc-800/40 p-1 rounded w-fit">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`px-4 py-1.5 font-semibold rounded transition text-sm flex items-center gap-1.5 ${
                    activeTab === 'video'
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <i className="fas fa-film text-xs"></i>Video
                </button>
                <button
                  onClick={() => setActiveTab('audio')}
                  className={`px-4 py-1.5 font-semibold rounded transition text-sm flex items-center gap-1.5 ${
                    activeTab === 'audio'
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <i className="fas fa-music text-xs"></i>Audio
                </button>
              </div>

              {/* Format List */}
              <div className="space-y-3">
                {activeTab === 'video'
                  ? videoInfo.formats.video.map((format, idx) => (
                      <FormatCard key={idx} format={format} isAudio={false} />
                    ))
                  : videoInfo.formats.audio.map((format, idx) => (
                      <FormatCard key={idx} format={format} isAudio={true} />
                    ))}
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-5xl mb-4 text-red-600/20">
              <i className="fas fa-circle-play"></i>
            </div>
            <p className="text-zinc-400 text-sm">Masukkan link untuk mulai download</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeDownloader;
