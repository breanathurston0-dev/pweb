import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, Maximize, Settings, SkipForward, Landmark, Sparkles, Tv } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  watermarkText: string;
  onEnded: () => void;
  title: string;
  currentLang: "en" | "km";
  poster?: string;
}

export default function VideoPlayer({
  videoUrl,
  watermarkText,
  onEnded,
  title,
  currentLang,
  poster
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [quality, setQuality] = useState("1080p HD");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ top: "25%", left: "25%" });

  // Dynamically jump the security watermark randomly across the screen to obstruct stream capture
  useEffect(() => {
    const timer = setInterval(() => {
      const randomTop = Math.floor(Math.random() * 50) + 20; // range 20% to 70%
      const randomLeft = Math.floor(Math.random() * 50) + 15; // range 15% to 65%
      setWatermarkPos({
        top: `${randomTop}%`,
        left: `${randomLeft}%`
      });
    }, 8000); // changes every 8 seconds

    return () => clearInterval(timer);
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Playback error:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const clickTime = parseFloat(e.target.value);
    videoRef.current.currentTime = clickTime;
    setCurrentTime(clickTime);
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const freshVol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = freshVol;
    }
    setVolume(freshVol);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Exit FS error:", err));
    } else {
      containerRef.current.requestFullscreen().catch(err => console.error("Req FS error:", err));
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      ref={containerRef}
      className="bg-black rounded-2xl relative shadow-2xl overflow-hidden aspect-video border border-slate-700/50 group select-none"
    >
      {/* HTML5 video element with block context preventing download/controls context menus */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="w-full h-full object-contain pointer-events-auto"
        controlsList="nodownload noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          onEnded();
        }}
        onClick={handlePlayPause}
      />

      {/* Top Bar HD Stream Badge */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-lg border border-blue-400/40 tracking-wider">
            <Tv className="w-3.5 h-3.5 text-cyan-200" />
            <span>HD {quality}</span>
          </span>
          <span className="bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>HIGH BITRATE</span>
          </span>
        </div>

        {title && (
          <span className="bg-slate-950/80 backdrop-blur-md text-slate-200 text-xs font-semibold px-3 py-1 rounded-md border border-white/10 truncate max-w-[220px] md:max-w-xs">
            {title}
          </span>
        )}
      </div>

      {/* Center HD PLAY Overlay (Shown when paused or before playback starts) */}
      {!isPlaying && (
        <div 
          onClick={handlePlayPause}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 z-20 hover:bg-black/30 group/center"
        >
          {/* Pulsing play trigger */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-500/30 animate-ping pointer-events-none"></div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 border-2 border-white/80 group-hover/center:scale-110 transition-transform duration-200">
              <Play className="w-8 h-8 md:w-9 md:h-9 fill-white text-white translate-x-0.5" />
            </div>
          </div>

          {/* Prominent HD PLAY Badge Tag */}
          <div className="mt-4 flex items-center gap-2 bg-slate-950/90 text-white border border-blue-400/40 px-4 py-1.5 rounded-full shadow-xl group-hover/center:border-blue-400">
            <span className="bg-blue-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded tracking-wider">HD</span>
            <span className="font-black text-xs md:text-sm tracking-wider uppercase font-sans">PLAY VIDEO</span>
          </div>
          <span className="text-[11px] text-slate-300 font-medium mt-1.5 drop-shadow">
            {currentLang === "en" ? "Click to play in 1080p HD" : "ចុចដើម្បីទស្សនាកម្រិត HD ច្បាស់ត្រជាក់ភ្នែក"}
          </span>
        </div>
      )}

      {/* Floating security watermark */}
      <div 
        className="absolute text-white/10 text-xs md:text-sm tracking-wider font-mono select-none pointer-events-none z-10 transition-all duration-1000 ease-in-out font-bold pointer-events-none flex items-center gap-1.5 opacity-20 border border-white/5 bg-black/5 px-2 py-1 rounded"
        style={{ top: watermarkPos.top, left: watermarkPos.left }}
      >
        <Landmark className="w-3.5 h-3.5" />
        <span>{watermarkText} - SABAI LMS</span>
      </div>

      {/* Controller overlay HUD */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3 z-30">
        {/* Progress Bar slider */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full accent-blue-500 h-1 bg-slate-600/50 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all"
          />
        </div>

        {/* Dashboard bottom hud tools */}
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="hover:scale-110 active:scale-95 transition-all p-1 hover:bg-white/10 rounded-full cursor-pointer flex items-center gap-1"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white fill-white" />}
            </button>
            
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="hover:bg-white/10 p-1 rounded-full cursor-pointer"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>

            <span className="text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* HD Resolution Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 px-2 py-1 rounded text-xs font-mono font-bold tracking-wider cursor-pointer border border-blue-400/40"
                title="Select Stream Quality"
              >
                <span>{quality}</span>
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700/80 p-1.5 rounded-lg flex flex-col whitespace-nowrap shadow-xl z-50">
                  <span className="text-[9px] text-slate-400 px-2 py-1 uppercase font-bold border-b border-slate-800">Stream Quality</span>
                  {["4K Ultra HD", "1080p HD", "720p HD", "Auto (Dynamic)"].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setQuality(q);
                        setShowQualityMenu(false);
                      }}
                      className={`px-3 py-1 text-left text-xs font-mono rounded hover:bg-slate-800 transition-colors ${quality === q ? "text-blue-400 font-bold bg-blue-950/50" : "text-slate-300"}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded-lg text-xs font-mono cursor-pointer relative">
              <Settings className="w-3.5 h-3.5" />
              <span>{playbackSpeed}x</span>
              <div className="absolute bottom-full mb-1 right-0 bg-slate-900 border border-slate-700/80 p-1.5 rounded-lg opacity-0 pointer-events-none hover:opacity-100 group-hover:block hidden flex-col whitespace-nowrap shadow-lg">
                <button onClick={() => changeSpeed(0.75)} className="px-2 py-0.5 hover:bg-slate-800 text-left w-full text-[10px]">0.75x</button>
                <button onClick={() => changeSpeed(1.0)} className="px-2 py-0.5 hover:bg-slate-800 text-left w-full text-[10px]">1.0x (Normal)</button>
                <button onClick={() => changeSpeed(1.25)} className="px-2 py-0.5 hover:bg-slate-800 text-left w-full text-[10px]">1.25x</button>
                <button onClick={() => changeSpeed(1.5)} className="px-2 py-0.5 hover:bg-slate-800 text-left w-full text-[10px]">1.5x</button>
                <button onClick={() => changeSpeed(2.0)} className="px-2 py-0.5 hover:bg-slate-800 text-left w-full text-[10px]">2.0x</button>
              </div>
            </div>

            {/* Volume controls */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-white" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 accent-blue-500 h-1 bg-slate-600/50 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Fullscreen control */}
            <button
              onClick={toggleFullscreen}
              className="hover:scale-110 active:scale-95 transition-all p-1 hover:bg-white/10 rounded-full cursor-pointer"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
