"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import WaveSurfer from "wavesurfer.js";

export default function DualCrossfadePlayer({
  trackTitle,
  crossTitle,
  aTitle,
  bTitle,
  trackA,
  trackB,
}: {
  trackTitle: string;
  crossTitle: string;
  aTitle: string;
  bTitle: string;
  trackA: string;
  trackB: string;
}) {
  const uid = useRef(Math.random().toString(36).slice(2));
  const waveA = useRef<WaveSurfer | null>(null);
  const waveB = useRef<WaveSurfer | null>(null);

  const playerA = useRef<Howl | null>(null);
  const playerB = useRef<Howl | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [crossfade, setCrossfade] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const [showWaves, setShowWaves] = useState(true);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const startPlayback = () => {
    if (isPlaying) return;

    playerA.current = new Howl({
      src: [trackA],
      volume: 1 - crossfade,
      html5: false,
      loop,
      onload: () => {
        setDuration(playerA.current?.duration() || 0);
      },
    });

    playerB.current = new Howl({
      src: [trackB],
      volume: crossfade,
      html5: false,
      loop,
    });

    playerA.current.play();
    playerB.current.play();

    setIsPlaying(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (!playerA.current || !playerB.current) return;

    if (isPaused) {
      playerA.current.play();
      playerB.current.play();
      setIsPaused(false);
    } else {
      playerA.current.pause();
      playerB.current.pause();
      setIsPaused(true);
    }
  };

  const restartPlayback = () => {
    if (!playerA.current || !playerB.current) return;

    playerA.current.seek(0);
    playerB.current.seek(0);

    if (!isPaused) {
      playerA.current.play();
      playerB.current.play();
    }

    setCurrentTime(0);
    setProgress(0);
  };

  const updateCrossfade = (value: number) => {
    setCrossfade(value);

    if (playerA.current && playerB.current) {
      // DJ-style logarithmic fade curve
      const volA = Math.pow(1 - value, 1.5);
      const volB = Math.pow(value, 1.5);

      playerA.current.volume(volA);
      playerB.current.volume(volB);
    }
    if (waveA.current && waveB.current) {
      waveA.current.getWrapper().style.opacity = String(1 - value);
      waveA.current.getWrapper().style.filter = `drop-shadow(0 0 ${10 * (1 - value)}px #4caf50)`;
      waveB.current.getWrapper().style.opacity = String(value);
      waveB.current.getWrapper().style.filter = `drop-shadow(0 0 ${10 * value}px #9c27b0)`;
    }
  };

  const seekTo = (value: number) => {
    if (!playerA.current || !playerB.current) return;

    const newTime = value * duration;
    playerA.current.seek(newTime);
    playerB.current.seek(newTime);

    setCurrentTime(newTime);
    setProgress(value);
  };

  const closePlayer = () => {
    playerA.current?.stop();
    playerA.current?.unload();
    playerA.current = null;
    playerB.current?.stop();
    playerB.current?.unload();
    playerB.current = null;

    waveA.current?.destroy();
    waveA.current = null;
    waveB.current?.destroy();
    waveB.current = null;

    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
  };

  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const interval = setInterval(() => {
      if (playerA.current) {
        const pos = playerA.current.seek() as number;
        const dur = playerA.current.duration();

        setCurrentTime(pos);
        const ratio = dur > 0 ? pos / dur : 0;
        setProgress(ratio);

        if (waveA.current) waveA.current.seekTo(ratio);
        if (waveB.current) waveB.current.seekTo(ratio);

        // Manual loop safety
        if (loop && dur - pos < 0.2) {
          playerA.current.seek(0);
          playerB.current?.seek(0);

          if (!isPaused) {
            playerA.current.play();
            playerB.current?.play();
          }
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, loop]);

  useEffect(() => {
    return () => {
      playerA.current?.unload();
      playerB.current?.unload();
    };
  }, []);

  useEffect(() => {
    if (playerA.current) {
      playerA.current.loop(loop);
    }
    if (playerB.current) {
      playerB.current.loop(loop);
    }
  }, [loop]);

  useEffect(() => {
    if (!isPlaying || !showWaves) return;

    waveA.current = WaveSurfer.create({
      container: `#waveA-${uid.current}`,
      waveColor: "#4caf50",
      progressColor: "#81c784",
      height: 80,
      normalize: true,
    });

    waveB.current = WaveSurfer.create({
      container: `#waveB-${uid.current}`,
      waveColor: "#9c27b0",
      progressColor: "#ce93d8",
      height: 80,
      normalize: true,
    });

    waveA.current.load(trackA);
    waveB.current.load(trackB);

    return () => {
      waveA.current?.destroy();
      waveB.current?.destroy();
      waveA.current = null;
      waveB.current = null;
    };
  }, [isPlaying, showWaves]);

  return (
    <div
      style={{ width: "400px", margin: "20px auto", fontFamily: "sans-serif" }}
    >
      <h2>{trackTitle}</h2>

      {!isPlaying && <button onClick={startPlayback}>Play Tracks</button>}
      {isPlaying && (
        <>
          <button onClick={closePlayer}>Close Player</button>

          {/* Show/Hide Waves */}
          <button
            onClick={() => setShowWaves(!showWaves)}
            style={{
              marginLeft: "10px",
              marginTop: "10px",
              padding: "8px 16px",
              background: "#222",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {showWaves ? "Hide Waves" : "Show Waves"}
          </button>

          {showWaves && (
            <div style={{ marginTop: "20px" }}>
              <div
                id={`waveA-${uid.current}`}
                style={{ width: "100%", height: "80px" }}
              />
              <div
                id={`waveB-${uid.current}`}
                style={{ width: "100%", height: "80px", marginTop: "10px" }}
              />
            </div>
          )}

          {/* Loop Toggle */}
          <div style={{ marginTop: "10px" }}>
            <label>
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
              Loop
            </label>
          </div>

          {/* Crossfade */}
          <div style={{ marginTop: "20px" }}>
            <label>{crossTitle}</label>
            <input
              type="range"
              className="crossfade-slider"
              min={0}
              max={1}
              step={0.01}
              value={crossfade || 0}
              onChange={(e) => updateCrossfade(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{aTitle}</span>
              <span>{bTitle}</span>
            </div>
          </div>

          {/* Seek Bar */}
          <div style={{ marginTop: "20px" }}>
            <label>Seek</label>
            <input
              type="range"
              className="seek-slider"
              min={0}
              max={1}
              step={0.001}
              value={progress || 0}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          {/* Progress */}
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#444",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>

          {/* Restart */}
          <button
            onClick={restartPlayback}
            style={{
              marginLeft: "10px",
              padding: "8px 16px",
              background: "#666",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Restart
          </button>
        </>
      )}
      <style jsx>{`
        /* CROSSFADE SLIDER */
        .crossfade-slider::-webkit-slider-runnable-track {
          background: #4caf50;
          height: 8px;
          border-radius: 4px;
        }
        .crossfade-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          background: white;
          border: 2px solid #4caf50;
          border-radius: 50%;
          margin-top: -5px;
        }

        /* Firefox */
        .crossfade-slider::-moz-range-track {
          background: #4caf50;
          height: 8px;
          border-radius: 4px;
        }
        .crossfade-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          background: white;
          border: 2px solid #4caf50;
          border-radius: 50%;
        }

        /* SEEK SLIDER */
        .seek-slider::-webkit-slider-runnable-track {
          background: #276cb0;
          height: 8px;
          border-radius: 4px;
        }
        .seek-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          background: white;
          border: 2px solid #276cb0;
          border-radius: 50%;
          margin-top: -5px;
        }

        /* Firefox */
        .seek-slider::-moz-range-track {
          background: #276cb0;
          height: 8px;
          border-radius: 4px;
        }
        .seek-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          background: white;
          border: 2px solid #276cb0;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
