/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Terminal, Cpu } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

const TRACKS = [
  {
    title: "ERR:MEM_FRAG_01",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    title: "SYS.OVERRIDE_BETA",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    title: "HOST_NOT_FOUND.WAV",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  }
];

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const directionRef = useRef(INITIAL_DIRECTION);
  const directionQueueRef = useRef<{x: number, y: number}[]>([]);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setTrackIndex((i) => (i + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setTrackIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch((e) => console.log("SYS_ERR_AUDIO_LOCK", e));
    }
  }, [trackIndex, isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleAudioEnded = () => {
    nextTrack();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      if (gameOver) {
        if (e.key === ' ' || e.key === 'Enter') startGame();
        return;
      }

      const lastDir = directionQueueRef.current.length > 0 
        ? directionQueueRef.current[directionQueueRef.current.length - 1] 
        : directionRef.current;

      let newDir = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newDir = { x: 1, y: 0 };
          break;
      }

      if (newDir) {
        if (!(lastDir.x + newDir.x === 0 && lastDir.y + newDir.y === 0)) {
          directionQueueRef.current.push(newDir);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        let currentDir = directionRef.current;
        if (directionQueueRef.current.length > 0) {
          currentDir = directionQueueRef.current.shift()!;
          directionRef.current = currentDir;
        }

        const head = prevSnake[0];
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          
          let loopGuard = 0;
          let newFood;
          do {
            newFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE),
            };
            loopGuard++;
          } while (
            newSnake.some(s => s.x === newFood.x && s.y === newFood.y) && loopGuard < 1000
          );
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 80); 
    return () => clearInterval(interval);
  }, [food, gameOver]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    directionQueueRef.current = [];
    setScore(0);
    setGameOver(false);
    
    if (!isPlaying && audioRef.current) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen crt relative flex flex-col items-center justify-center p-4 md:p-8 font-sans bg-[#050505] text-cyan-400 overflow-hidden">
      <div className="static-bg"></div>
      
      <audio
        ref={audioRef}
        src={TRACKS[trackIndex].url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      <div className="w-full max-w-6xl z-10 space-y-8 tear">
        
        <header className="flex flex-col items-center text-center gap-2">
          <h1 
            className="text-6xl md:text-8xl font-black tracking-tighter glitch-text text-white uppercase"
            data-text="SYS.CRASH"
          >
            SYS.CRASH
          </h1>
          <p className="text-fuchsia-500 font-mono text-xl tracking-widest bg-black px-4 py-1 border border-fuchsia-500 shadow-[2px_2px_0_#00ffff]">
            // NEURAL_LINK_ESTABLISHED
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 items-stretch justify-center mt-8 w-full">
          
          <div className="flex-1 w-full max-w-[500px] flex flex-col items-center select-none bg-[#050505] border-glitch p-1">
            
            <div className="w-full flex justify-between items-center mb-2 px-4 py-2 border-b-2 border-cyan-400 font-mono bg-cyan-950/30">
              <div className="flex flex-col">
                <span className="text-xs text-fuchsia-500 uppercase">MEM.ALLOC</span>
                <span className="text-2xl font-bold">{score.toString().padStart(4, '0')}</span>
              </div>
              <Cpu className="w-8 h-8 text-fuchsia-500 max-sm:hidden animate-pulse" />
              <div className="flex flex-col items-end">
                <span className="text-xs text-fuchsia-500 uppercase">PEAK.ALLOC</span>
                <span className="text-2xl font-bold">{highScore.toString().padStart(4, '0')}</span>
              </div>
            </div>

            <div 
              className="w-full relative overflow-hidden bg-black border-2 border-neutral-900"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                aspectRatio: '1 / 1'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                
                const isHead = snake[0].x === x && snake[0].y === y;
                const isBody = !isHead && snake.some(s => s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;

                let cellClass = "";
                if (isHead) cellClass = "snake-head z-10";
                else if (isBody) cellClass = "snake-body";
                else if (isFood) cellClass = "food-cell z-0";

                return (
                  <div 
                    key={i} 
                    className={`flex items-center justify-center`}
                  >
                    {cellClass && <div className={`w-full h-full ${cellClass}`} />}
                  </div>
                );
              })}

              {gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
                  <h2 
                    className="text-4xl md:text-5xl font-mono font-bold mb-8 uppercase text-center glitch-text text-white"
                    data-text={score > 0 ? "FATAL_ERROR" : "AWAITING_INPUT"}
                  >
                    {score > 0 ? "FATAL_ERROR" : "AWAITING_INPUT"}
                  </h2>
                  <button 
                    onClick={startGame}
                    className="px-6 py-3 bg-[#050505] border-glitch text-fuchsia-500 uppercase font-mono text-xl focus:outline-none focus:bg-cyan-900/30 hover:bg-cyan-900/30 btn-press cursor-pointer"
                  >
                    [ {score > 0 ? "REBOOT_SYSTEM" : "EXECUTE"} ]
                  </button>
                  {score === 0 && (
                     <p className="mt-8 text-cyan-500 font-mono text-xs tracking-widest animate-pulse">PRESS_SPACE_TO_INSTANTIATE</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="w-full mt-2 font-mono text-xs text-neutral-400 bg-neutral-950 p-2 flex items-center justify-between border-t-2 border-cyan-400">
               <span>WASD / ARROWS = NAV</span>
               <span className="text-cyan-600 animate-pulse">■</span>
            </div>
          </div>

          <div className="flex-1 w-full max-w-[500px] flex flex-col justify-start">
            
            <div className="bg-[#050505] border-glitch-fuchsia p-6 relative overflow-hidden h-full flex flex-col">
              
              <div className="flex items-center justify-between border-b-2 border-fuchsia-500 mb-6 pb-2">
                <div className="flex items-center gap-2 font-mono text-fuchsia-500">
                  <Terminal className="w-5 h-5" />
                  <span className="text-sm">AUDIO_SUBSYSTEM_V1.9</span>
                </div>
                <div className="w-3 h-3 bg-cyan-400 rounded-none animate-pulse"></div>
              </div>

              <div className="w-full flex-1 min-h-[140px] border-2 border-cyan-400 bg-cyan-950/20 mb-6 relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute inset-0 flex items-end justify-between px-2 pb-2 gap-1 opacity-70">
                  {Array.from({length: 24}).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-full bg-fuchsia-500 transition-all duration-75"
                      style={{
                        height: isPlaying ? `${Math.random() * 80 + 10}%` : '5%',
                        animation: isPlaying ? `audio-bounce ${Math.random() * 0.5 + 0.2}s infinite alternate` : 'none'
                      }}
                    />
                  ))}
                </div>
                
                <style>{`
                  @keyframes audio-bounce {
                    0% { transform: scaleY(0.8); }
                    100% { transform: scaleY(1.2); }
                  }
                `}</style>

                <div className="z-10 bg-[#050505]/80 px-4 py-2 border border-fuchsia-500 text-center font-mono">
                  <p className="text-cyan-400 text-xs">BUFFER: {isPlaying ? 'STREAMING' : 'HALTED'}</p>
                  <p className="text-white text-lg font-bold glitch-text shadow-none" data-text={TRACKS[trackIndex].title}>
                    {TRACKS[trackIndex].title}
                  </p>
                </div>
              </div>

              <div className="font-mono text-xs mb-1 w-full flex justify-between text-cyan-500">
                <span>0x00</span>
                <span>0xFF</span>
              </div>
              <div className="w-full h-4 bg-neutral-900 border border-fuchsia-500 mb-6 cursor-pointer overflow-hidden relative" 
                   onClick={(e) => {
                     if(audioRef.current && audioRef.current.duration) {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                       audioRef.current.currentTime = percent * audioRef.current.duration;
                     }
                   }}>
                <div 
                  className="h-full bg-cyan-400 transition-all duration-100 ease-linear border-r-2 border-white"
                  style={{ width: `${progress}%` }}
                >
                  <div className="w-full h-[1px] bg-black/50 mt-1" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button 
                  onClick={() => { audioRef.current && (audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.2)) }}
                  className="text-cyan-400 hover:text-white bg-[#050505] border border-cyan-400 p-2 btn-press cursor-pointer"
                  title="VOL-"
                >
                   <Volume2 className="w-5 h-5 cursor-pointer" />
                </button>
                
                <div className="flex items-center gap-4">
                  <button onClick={prevTrack} className="p-2 border border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-black btn-press transition-colors cursor-pointer">
                    <SkipBack className="w-6 h-6 outline-none" />
                  </button>
                  <button 
                    onClick={togglePlay} 
                    className="p-4 bg-fuchsia-500 text-black border-2 border-white hover:bg-cyan-400 btn-press transition-colors font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 outline-none fill-current" /> : <Play className="w-6 h-6 outline-none fill-current" />}
                  </button>
                  <button onClick={nextTrack} className="p-2 border border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-black btn-press transition-colors cursor-pointer">
                    <SkipForward className="w-6 h-6 outline-none" />
                  </button>
                </div>
                
                <div className="w-9" /> 
              </div>
              
              <div className="mt-auto pt-6 text-right font-mono text-[10px] text-fuchsia-800">
                SEQ_IDX: {trackIndex} // THREAD_STATE: {isPlaying ? 'RUN' : 'SLP'}
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
