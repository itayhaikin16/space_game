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
  Laser
} from "./game-logic";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [gameStatus, setGameStatus] = useState<"Identity" | "Lobby" | "Playing" | "GameOver">("Identity");
  const [powerupStatus, setPowerupStatus] = useState("");
  const [leaderboard, setLeaderboard] = useState<{score: number, date: string, username?: string}[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [username, setUsername] = useState("");

  const keys = useRef<Record<string, boolean>>({});
  const gameState = useRef({
    player: new Player(),
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    powerups: [] as PowerUp[],
    stars: Array.from({ length: 50 }, () => new Star()),
    boss: null as Boss | null,
    score: 0,
    laserTimer: 0,
    laser: null as Laser | null,
    sidewaysLaserTimer: 0,
    sidewaysLaser: null as Laser | null,
    bossRespawnTimer: 0,
    vaporizerX: 0,
    vaporizerDir: 1,
  });

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

    if (gameStatus === "Playing") {
      gameState.current.enemies = Array.from({ length: 8 }, () => new Enemy());
    }

    let animationFrameId: number;

    const gameLoop = () => {
      if (gameStatus !== "Playing") return;

      const { player, bullets, enemies, powerups, stars } = gameState.current;

      player.update(keys.current);
      bullets.forEach(b => b.update());
      enemies.forEach(e => e.update());
      powerups.forEach(p => p.update());
      stars.forEach(s => s.update());

      // Vaporizer logic (Windshield Wiper effect)
      if (player.powerupActive === "vaporizer") {
        gameState.current.vaporizerX += 12 * gameState.current.vaporizerDir;
        if (gameState.current.vaporizerX <= 0) {
          gameState.current.vaporizerX = 0;
          gameState.current.vaporizerDir = 1;
        } else if (gameState.current.vaporizerX >= SCREEN_WIDTH) {
          gameState.current.vaporizerX = SCREEN_WIDTH;
          gameState.current.vaporizerDir = -1;
        }

        const beamHalfWidth = 20;
        const beamLeft = gameState.current.vaporizerX - beamHalfWidth;
        const beamRight = gameState.current.vaporizerX + beamHalfWidth;

        // Vaporize enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (beamLeft < e.x + e.width && beamRight > e.x) {
            enemies.splice(i, 1);
            gameState.current.score += 10;
            setScore(gameState.current.score);
            
            if (Math.random() < 0.2) {
              const type = Math.random() < 0.5 ? "triple" : "health";
              powerups.push(new PowerUp(e.x + e.width / 2, e.y + e.height / 2, type));
            }
            
            const speedMod = 1 + Math.min(Math.floor(gameState.current.score / 1000), 2);
            enemies.push(new Enemy(speedMod));
          }
        }

        // Vaporize boss
        if (gameState.current.boss) {
          const b = gameState.current.boss;
          if (beamLeft < b.x + b.width && beamRight > b.x) {
            b.health -= 2; // Stronger damage while beam is over boss
          }
        }
      }

      if (gameState.current.score >= 1000) {
        gameState.current.laserTimer++;
        if (gameState.current.laserTimer >= 600) {
          gameState.current.laser = new Laser('vertical', Math.random() * (SCREEN_WIDTH - 60));
          gameState.current.laserTimer = 0;
        }
      }

      if (gameState.current.score >= 10000) {
        gameState.current.sidewaysLaserTimer++;
        if (gameState.current.sidewaysLaserTimer >= 900) {
          gameState.current.sidewaysLaser = new Laser('sideways', Math.random() * (SCREEN_HEIGHT - 60), 160);
          gameState.current.sidewaysLaserTimer = 0;
        }
      }

      if (gameState.current.laser) {
        gameState.current.laser.update();
        if (gameState.current.laser.duration <= 0) {
          gameState.current.laser = null;
        } else if (gameState.current.laser.collidesWith(player.x, player.y, player.width, player.height)) {
            player.health -= 1;
            setHealth(player.health);
            if (player.health <= 0) setGameStatus("GameOver");
        }
      }

      if (gameState.current.sidewaysLaser) {
        gameState.current.sidewaysLaser.update();
        if (gameState.current.sidewaysLaser.duration <= 0) {
          gameState.current.sidewaysLaser = null;
        } else if (gameState.current.sidewaysLaser.collidesWith(player.x, player.y, player.width, player.height)) {
            player.health -= 1;
            setHealth(player.health);
            if (player.health <= 0) setGameStatus("GameOver");
        }
      }

      if (!gameState.current.boss && gameState.current.score >= 2000) {
        if (gameState.current.bossRespawnTimer > 0) {
          gameState.current.bossRespawnTimer--;
        } else {
          gameState.current.boss = new Boss();
        }
      }

      if (gameState.current.boss) {
        gameState.current.boss.update(bullets);
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.y < 0 || b.y > SCREEN_HEIGHT) {
          bullets.splice(i, 1);
          continue;
        }

        if (gameState.current.boss && 
            b.color === BULLET_COLOR &&
            b.x < gameState.current.boss!.x + gameState.current.boss!.width &&
            b.x + b.width > gameState.current.boss!.x &&
            b.y < gameState.current.boss!.y + gameState.current.boss!.height &&
            b.y + b.height > gameState.current.boss!.y) {
          
          bullets.splice(i, 1);
          gameState.current.boss!.health -= 10;
          if (gameState.current.boss!.health <= 0) {
            gameState.current.score += 500;
            setScore(gameState.current.score);
            
            // Drop pink vaporizer orb
            powerups.push(new PowerUp(gameState.current.boss!.x + gameState.current.boss!.width / 2, gameState.current.boss!.y + gameState.current.boss!.height / 2, "vaporizer"));
            
            gameState.current.boss = null;
            gameState.current.bossRespawnTimer = 7200; // 2 minutes respawn
          }
          continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (
            b.color === BULLET_COLOR &&
            b.x < e.x + e.width &&
            b.x + b.width > e.x &&
            b.y < e.y + e.height &&
            b.y + b.height > e.y
          ) {
            bullets.splice(i, 1);
            gameState.current.score += 10;
            setScore(gameState.current.score);

            if (Math.random() < 0.2) {
              const type = Math.random() < 0.5 ? "triple" : "health";
              powerups.push(new PowerUp(e.x + e.width / 2, e.y + e.height / 2, type));
            }

            const speedMod = 1 + Math.min(Math.floor(gameState.current.score / 1000), 2);
            enemies[j] = new Enemy(speedMod);
            break;
          }
        }
      }

      for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (p.y > SCREEN_HEIGHT) {
          powerups.splice(i, 1);
          continue;
        }
        if (
          player.x < p.x + p.width &&
          player.x + player.width > p.x &&
          player.y < p.y + p.height &&
          player.y + player.height > p.y
        ) {
          if (p.type === "triple") {
            player.powerupActive = "triple";
            player.powerupTimer = 300;
          } else if (p.type === "health") {
            player.health++;
            setHealth(player.health);
          } else if (p.type === "vaporizer") {
            player.powerupActive = "vaporizer";
            player.powerupTimer = 480; // 8 seconds at 60fps
          }
          powerups.splice(i, 1);
        }
      }

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (
          player.x < e.x + e.width &&
          player.x + player.width > e.x &&
          player.y < e.y + e.height &&
          player.y + player.height > e.y
        ) {
          player.health--;
          setHealth(player.health);
          enemies[i] = new Enemy(1 + Math.min(Math.floor(gameState.current.score / 1000), 2));
          if (player.health <= 0) {
            setGameStatus("GameOver");
          }
          break;
        }
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.color === ENEMY_BULLET_COLOR &&
            player.x < b.x + b.width &&
            player.x + player.width > b.x &&
            player.y < b.y + b.height &&
            player.y + player.height > b.y) {
          
          bullets.splice(i, 1);
          player.health -= 1;
          setHealth(player.health);
          if (player.health <= 0) {
            setGameStatus("GameOver");
          }
        }
      }

      setPowerupStatus(player.powerupActive === "triple" ? `TRIPLE (${Math.ceil(player.powerupTimer / 60)}s)` : "");

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      stars.forEach(s => s.draw(ctx));
      player.draw(ctx);
      bullets.forEach(b => b.draw(ctx));
      enemies.forEach(e => e.draw(ctx));
      powerups.forEach(p => p.draw(ctx));
      
      if (gameState.current.boss) {
        gameState.current.boss.draw(ctx);
        
        // Draw Boss Health Bar
        const boss = gameState.current.boss;
        const barWidth = 100;
        const barHeight = 10;
        const x = boss.x + (boss.width - barWidth) / 2;
        const y = boss.y - 20;
        const currentHealthWidth = (boss.health / 500) * barWidth;
        
        ctx.fillStyle = "gray";
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, currentHealthWidth, barHeight);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Boss Health Number
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`HP: ${Math.max(0, Math.ceil(boss.health))}`, x + barWidth / 2, y - 5);
      }

      if (gameState.current.laser) {
        ctx.fillStyle = gameState.current.laser.active ? "red" : "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(gameState.current.laser.x, 0, gameState.current.laser.width, SCREEN_HEIGHT);
      }

      if (gameState.current.sidewaysLaser) {
        ctx.fillStyle = gameState.current.sidewaysLaser.active ? "red" : "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(0, gameState.current.sidewaysLaser.y, SCREEN_WIDTH, gameState.current.sidewaysLaser.height);
      }

      if (player.powerupActive === "vaporizer") {
        const vX = gameState.current.vaporizerX;
        ctx.fillStyle = "rgba(255, 0, 255, 0.4)";
        ctx.fillRect(vX - 20, 0, 40, SCREEN_HEIGHT);
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vX, 0);
        ctx.lineTo(vX, SCREEN_HEIGHT);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus]);

  const startGame = () => {
    gameState.current = {
      player: new Player(),
      bullets: [],
      enemies: Array.from({ length: 8 }, () => new Enemy()),
      powerups: [],
      stars: Array.from({ length: 50 }, () => new Star()),
      boss: null,
      score: 0,
      laserTimer: 0,
      laser: null,
      sidewaysLaserTimer: 0,
      sidewaysLaser: null,
      bossRespawnTimer: 0,
      vaporizerX: 0,
      vaporizerDir: 1,
    };
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
          
          <div className="flex gap-4">
            <button
              onClick={startGame}
              className="px-12 py-4 bg-green-600 hover:bg-green-500 text-white text-2xl font-bold rounded-full transition-all transform hover:scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
            >
              LAUNCH GAME
            </button>
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="px-12 py-4 bg-gray-700 hover:bg-gray-600 text-white text-2xl font-bold rounded-full transition-all transform hover:scale-110 border-2 border-gray-500"
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
            <h2 className="text-3xl text-center mb-6 font-bold text-green-400 uppercase tracking-widest">Global Top 10</h2>
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
            Score: {score} | Health: {health} {powerupStatus && `| ${powerupStatus}`}
          </div>

          {gameStatus === "GameOver" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
              <h1 className="text-6xl text-red-600 font-bold mb-4">GAME OVER</h1>
              <p className="text-2xl mb-8">Final Score: {score}</p>
              <div className="flex gap-4">
                <button
                  onClick={startGame}
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
          Use Arrow Keys to move and Space to shoot
        </div>
      )}
    </div>
  );
}
