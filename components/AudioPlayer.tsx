"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import WaveSurfer from "wavesurfer.js";
import VolumeHigh from "@/public/icons/speaker-loud.svg";
import VolumeLow from "@/public/icons/speaker-quiet.svg";
import VolumeMuted from "@/public/icons/speaker-mute.svg";
import PlayButton from "@/public/icons/play-button.svg";
import PauseButton from "@/public/icons/pause-button.svg";
import Image from "next/image";

export default function DualCrossfadePlayer({
  trackTitle,
  crossTitle,
  aTitle,
  bTitle,
  trackA,
  trackB,
  colorA,
  colorB,
}: {
  trackTitle: string;
  crossTitle: string;
  aTitle: string;
  bTitle: string;
  trackA: string;
  trackB: string;
  colorA: string;
  colorB: string;
}) {
  const uid = useRef(Math.random().toString(36).slice(2));
  const waveA = useRef<WaveSurfer | null>(null);
  const waveB = useRef<WaveSurfer | null>(null);
  const lighterWaveA = lighten(colorA, 42);
  const lighterWaveB = lighten(colorB, 42);

  const playerA = useRef<Howl | null>(null);
  const playerB = useRef<Howl | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [crossfade, setCrossfade] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [masterVolume, setMasterVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const [showWaves, setShowWaves] = useState(false);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  function lighten(color: string, amount: number) {
    return `color-mix(in srgb, ${color} ${100 - amount}%, white ${amount}%)`;
  }

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
    applyMasterVolume(masterVolume);
    updateCrossfade(crossfade);

    if (isMuted) {
      playerA.current.volume(0);
      playerB.current.volume(0);
    }

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

  const updateCrossfade = (value: number) => {
    setCrossfade(value);

    if (playerA.current && playerB.current) {
      const volA = Math.pow(1 - value, 1.5) * (isMuted ? 0 : masterVolume);
      const volB = Math.pow(value, 1.5) * (isMuted ? 0 : masterVolume);

      playerA.current.volume(volA);
      playerB.current.volume(volB);
    }
    if (waveA.current && waveB.current) {
      waveA.current.getWrapper().style.opacity = String(1 - value);
      waveB.current.getWrapper().style.opacity = String(value);
    }
  };

  const applyMasterVolume = (vol: number) => {
    if (!playerA.current || !playerB.current) return;

    const volA = Math.pow(1 - crossfade, 1.5) * vol;
    const volB = Math.pow(crossfade, 1.5) * vol;

    playerA.current.volume(volA);
    playerB.current.volume(volB);
  };

  const toggleMute = () => {
    if (!playerA.current || !playerB.current) return;

    if (isMuted) {
      applyMasterVolume(masterVolume);
      setIsMuted(false);
    } else {
      playerA.current.volume(0);
      playerB.current.volume(0);
      setIsMuted(true);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || masterVolume === 0) return VolumeMuted;
    if (masterVolume < 0.5) return VolumeLow;
    return VolumeHigh;
  };

  const updateMasterVolume = (value: number) => {
    setMasterVolume(value);
    if (!isMuted) applyMasterVolume(value);
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
      waveColor: colorA,
      progressColor: lighterWaveA,
      height: 80,
      normalize: true,
    });

    waveB.current = WaveSurfer.create({
      container: `#waveB-${uid.current}`,
      waveColor: colorB,
      progressColor: lighterWaveB,
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
      style={{
        display: "block",
        margin: "0 auto",
        width: "400px",
        fontFamily: "sans-serif",
      }}
    >
      <h2>{trackTitle}</h2>

      {!isPlaying && <button onClick={startPlayback}>Play Track</button>}
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
                style={{ width: "75%", height: "80px" }}
              />
              <div
                id={`waveB-${uid.current}`}
                style={{ width: "75%", height: "80px", marginTop: "10px" }}
              />
            </div>
          )}

          {/* Crossfade */}
          <div style={{ marginTop: "20px", marginLeft: "0px", width: "75%" }}>
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
              <span>|</span>
              <span>{bTitle}</span>
            </div>
          </div>

          {/* Loop Toggle */}
          <div style={{ marginTop: "15px" }}>
            <label>
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
              Loop
            </label>
          </div>

          {/* Seek Bar */}
          <div style={{ marginTop: "5px", marginLeft: "0px", width: "75%" }}>
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
          <div style={{ marginTop: "10px", textAlign: "center", width: "75%" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#bebebe",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isPaused ? (
              <Image src={PlayButton} alt="stop icon" width={25} height={28} />
            ) : (
              <Image src={PauseButton} alt="stop icon" width={25} height={28} />
            )}
          </button>

          {/* Volume Controll */}
          <div
            className="volume-wrapper"
            style={{
              marginTop: "10px",
              paddingRight: "42px",
              position: "relative",
              display: "inline-block",
            }}
          >
            <button
              onClick={toggleMute}
              style={{
                marginTop: "10px",
                marginLeft: "10px",
                padding: "8px 16px",
                background: isMuted ? "#b71c1c" : "#bebebe",
                color: "white",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Image
                src={getVolumeIcon()}
                alt="volume icon"
                width={22}
                height={25}
              />
            </button>

            <div
              className="volume-slider-container"
              style={{
                position: "absolute",
                top: "15px",
                right: "-100px",
                width: "120px",
                padding: "3px",
                background: "#222",
                borderRadius: "6px",
                display: "none",
              }}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={masterVolume}
                onChange={(e) => updateMasterVolume(parseFloat(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </>
      )}
      <style jsx>{`
        :global(.volume-wrapper:hover .volume-slider-container) {
          display: block !important;
        }

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
