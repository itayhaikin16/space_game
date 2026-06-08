"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  SCREEN_WIDTH, 
  SCREEN_HEIGHT, 
  BULLET_COLOR, 
  BG_COLOR, 
  ENEMY_BULLET_COLOR, 
  Player, 
  Bullet, 
  PowerUp, 
  Enemy, 
  Boss, 
  Star,
  Laser,
  Asteroid
} from "./game-logic";
import { initGameState, updateGame, drawGame, GameState } from "./game-engine";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [gameStatus, setGameStatus] = useState<"Identity" | "Lobby" | "Playing" | "GameOver">("Identity");
  const [gameMode, setGameMode] = useState<"Shooter" | "Survival">("Shooter");
  const [powerupStatus, setPowerupStatus] = useState("");
  const [leaderboard, setLeaderboard] = useState<{score: number, date: string, username?: string}[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [username, setUsername] = useState("");

  const keys = useRef<Record<string, boolean>>({});
  const gameState = useRef<GameState>(initGameState());

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setLeaderboard(data);
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
      }
    };
    fetchScores();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.repeat) return;
      if (e.code === "Space" && gameStatus === "Playing") {
        const p = gameState.current.player;
        const centerX = p.x + p.width / 2;
        const centerY = p.y;

        if (p.powerupActive === "triple") {
          const bulletSpeed = 7;
          const angle = Math.PI / 4; // 45 degrees
          gameState.current.bullets.push(
            new Bullet(centerX, centerY, 0, -bulletSpeed),
            new Bullet(centerX, centerY, -bulletSpeed * Math.sin(angle), -bulletSpeed * Math.cos(angle)),
            new Bullet(centerX, centerY, bulletSpeed * Math.sin(angle), -bulletSpeed * Math.cos(angle))
          );
        } else {
          gameState.current.bullets.push(new Bullet(centerX, centerY, 0, -7));
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      if (gameStatus !== "Playing") return;

      updateGame(
        gameState.current,
        keys.current,
        gameMode,
        (s) => setScore(s),
        (h) => setHealth(h),
        () => setGameStatus("GameOver")
      );

      drawGame(ctx, gameState.current, gameMode);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, gameMode]);

  const startGame = (mode: "Shooter" | "Survival") => {
    setGameMode(mode);
    const state = initGameState();
    state.enemies = mode === "Shooter" ? Array.from({ length: 8 }, () => new Enemy()) : [];
    state.asteroids = mode === "Survival" ? Array.from({ length: 12 }, () => new Asteroid()) : [];
    gameState.current = state;
    setScore(0);
    setHealth(3);
    setGameStatus("Playing");
    setPowerupStatus("");
  };

  const saveScore = async (finalScore: number) => {
    const newScore = { score: finalScore, username, date: new Date().toLocaleDateString() };
    
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newScore),
      });
      const updatedLeaderboard = await res.json();
      setLeaderboard(updatedLeaderboard);
    } catch (e) {
      console.error("Failed to save score", e);
    }
  };

  useEffect(() => {
    if (gameStatus === "GameOver") {
      saveScore(score);
    }
  }, [gameStatus]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono">
      {gameStatus === "Identity" && (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
          <h1 className="text-6xl font-bold text-green-500 mb-4">SPACE DEFENDER</h1>
          <div className="bg-gray-900 p-8 rounded-2xl border-4 border-green-500 w-96 flex flex-col items-center gap-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <h2 className="text-2xl font-bold text-green-400 uppercase tracking-widest">Pilot Identification</h2>
            <input 
              type="text" 
              placeholder="Enter your callsign..." 
              className="bg-black border-2 border-green-700 text-green-400 p-3 rounded-lg w-full text-center outline-none focus:border-green-400 transition-colors font-mono text-xl"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && username && setGameStatus("Lobby")}
            />
            <button
              onClick={() => username && setGameStatus("Lobby")}
              className="px-12 py-3 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95"
            >
              CONFIRM PILOT
            </button>
          </div>
          <p className="text-gray-500 text-sm">Enter your name to join the global leaderboard</p>
        </div>
      )}

      {gameStatus === "Lobby" && (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
          <h1 className="text-6xl font-bold text-green-500 mb-4">SPACE DEFENDER</h1>
          
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <button
                onClick={() => startGame("Shooter")}
                className="px-12 py-4 bg-green-600 hover:bg-green-500 text-white text-2xl font-bold rounded-full transition-all transform hover:scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
              >
                SHOOTER MODE
              </button>
              <button
                onClick={() => startGame("Survival")}
                className="px-12 py-4 bg-orange-600 hover:bg-orange-500 text-white text-2xl font-bold rounded-full transition-all transform hover:scale-110 shadow-[0_0_20px_rgba(234,88,12,0.5)]"
              >
                SURVIVAL MODE
              </button>
            </div>
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="px-12 py-3 bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold rounded-full transition-all transform hover:scale-110 border-2 border-gray-500"
            >
              LEADERBOARD
            </button>
          </div>
        </div>
      )}

      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="bg-gray-900 p-8 rounded-2xl border-4 border-green-500 w-96 relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setIsLeaderboardOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-6 font-bold text-green-400 uppercase tracking-widest pr-4">
              <h2>Global Top 10</h2>
              <button 
                onClick={async () => {
                  const res = await fetch("/api/leaderboard");
                  const data = await res.json();
                  setLeaderboard(data);
                }}
                className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-2 py-1 rounded border border-green-700 transition-colors"
              >
                REFRESH
              </button>
            </div>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No scores yet!</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-800 py-2 px-2">
                    <div className="flex gap-3">
                      <span className="text-green-500 font-bold">{idx + 1}.</span>
                      <span className="truncate max-w-[120px]">{entry.username || "Anonymous"}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-green-400 font-bold">{entry.score}</span>
                      <span className="text-[10px] text-gray-500">{entry.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setIsLeaderboardOpen(false)}
              className="mt-8 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {(gameStatus === "Playing" || gameStatus === "GameOver") && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            className="border-4 border-gray-700 shadow-2xl"
          />
          
          <div className="absolute top-4 left-4 text-xl">
            {gameMode === "Shooter" ? `Score: ${score}` : `Meters: ${score}`} | Health: {health} {powerupStatus && `| ${powerupStatus}`}
          </div>

          {gameStatus === "GameOver" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
              <h1 className="text-6xl text-red-600 font-bold mb-4">GAME OVER</h1>
              <p className="text-2xl mb-8">Final Score: {score}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => startGame(gameMode)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xl rounded-lg transition-colors"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={() => setGameStatus("Lobby")}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-110 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                >
                  LOBBY
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {gameStatus === "Playing" && (
        <div className="mt-4 text-gray-400 text-sm">
          {gameMode === "Shooter" 
            ? "Use Arrow Keys to move and Space to shoot" 
            : "Use Arrow Keys to move and dodge the asteroids!"}
        </div>
      )}
    </div>
  );
}
