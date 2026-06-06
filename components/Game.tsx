"use client";

import React, { useEffect, useRef, useState } from "react";

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const PLAYER_COLOR = "#00FF00";
const ENEMY_COLOR = "#787878";
const BULLET_COLOR = "#FFFF00";
const BG_COLOR = "#0A0A1E";
const POWERUP_COLOR_TRIPLE = "#00C8FF";
const POWERUP_COLOR_HEALTH = "#00FF64";
const ENEMY_BULLET_COLOR = "#FF00FF"; // Magenta for boss bullets

class Player {
  x: number;
  y: number;
  width: number = 50;
  height: number = 40;
  speed: number = 5;
  health: number = 3;
  powerupActive: string | null = null;
  powerupTimer: number = 0;

  constructor() {
    this.x = SCREEN_WIDTH / 2 - this.width / 2;
    this.y = SCREEN_HEIGHT - 50;
  }

  update(keys: Record<string, boolean>) {
    if (keys["ArrowLeft"] && this.x > 0) this.x -= this.speed;
    if (keys["ArrowRight"] && this.x + this.width < SCREEN_WIDTH) this.x += this.speed;
    if (keys["ArrowUp"] && this.y > 0) this.y -= this.speed;
    if (keys["ArrowDown"] && this.y + this.height < SCREEN_HEIGHT) this.y += this.speed;

    if (this.powerupActive) {
      this.powerupTimer--;
      if (this.powerupTimer <= 0) {
        this.powerupActive = null;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.moveTo(this.x + 25, this.y);
    ctx.lineTo(this.x + 5, this.y + 35);
    ctx.lineTo(this.x + 25, this.y + 30);
    ctx.lineTo(this.x + 45, this.y + 35);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = "#C8C8FF";
    ctx.beginPath();
    ctx.arc(this.x + 25, this.y + 15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Wing details
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x + 5, this.y + 35);
    ctx.lineTo(this.x + 45, this.y + 35);
    ctx.stroke();
  }
}

class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;

  constructor(x: number, y: number, vx: number, vy: number, color = BULLET_COLOR, width = 5, height = 10) {
    this.width = width;
    this.height = height;
    this.x = x - this.width / 2;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class PowerUp {
  x: number;
  y: number;
  width: number = 20;
  height: number = 20;
  type: "triple" | "health";
  speed: number = 3;

  constructor(x: number, y: number, type: "triple" | "health") {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.type = type;
  }

  update() {
    this.y += this.speed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.type === "triple" ? POWERUP_COLOR_TRIPLE : POWERUP_COLOR_HEALTH;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Enemy {
  x: number;
  y: number;
  width: number = 40;
  height: number = 40;
  speed: number;
  points: { x: number; y: number }[] = [];

  constructor(speedModifier = 1) {
    this.x = Math.random() * (SCREEN_WIDTH - 40) + 20;
    this.y = Math.random() * -100 - 40;
    this.speed = (Math.random() * 3 + 2) * speedModifier;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = Math.random() * 5 + 15;
      this.points.push({
        x: 20 + dist * Math.cos(angle),
        y: 20 + dist * Math.sin(angle),
      });
    }
  }

  update() {
    this.y += this.speed;
    if (this.y > SCREEN_HEIGHT) {
      this.y = Math.random() * -100 - 40;
      this.x = Math.random() * (SCREEN_WIDTH - 40) + 20;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = ENEMY_COLOR;
    ctx.beginPath();
    ctx.moveTo(this.x + this.points[0].x, this.y + this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.x + this.points[i].x, this.y + this.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#969696";
    ctx.beginPath();
    ctx.arc(this.x + 15, this.y + 15, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#505050";
    ctx.beginPath();
    ctx.arc(this.x + 25, this.y + 25, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Boss {
  x: number = SCREEN_WIDTH / 2 - 50;
  y: number = -100;
  width: number = 100;
  height: number = 60;
  health: number = 20;
  speed: number = 2;
  direction: number = 1;
  shootTimer: number = 0;
  targetY: number = 50;

  update(bullets: Bullet[]) {
    if (this.y < this.targetY) {
      this.y += 1;
    } else {
      this.x += this.speed * this.direction;
      if (this.x <= 0 || this.x + this.width >= SCREEN_WIDTH) {
        this.direction *= -1;
      }

      this.shootTimer++;
      if (this.shootTimer >= 30) {
        bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height, 0, 10, ENEMY_BULLET_COLOR, 10, 20));
        this.shootTimer = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#AA0000";
    ctx.fillRect(this.x + 20, this.y - 10, 60, 10);
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.arc(this.x + 25, this.y + 30, 8, 0, Math.PI * 2);
    ctx.arc(this.x + 75, this.y + 30, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Star {
  x: number = Math.random() * SCREEN_WIDTH;
  y: number = Math.random() * SCREEN_HEIGHT;
  size: number = Math.random() * 2 + 1;
  speed: number = Math.random() * 3 + 1;

  update() {
    this.y += this.speed;
    if (this.y > SCREEN_HEIGHT) {
      this.y = 0;
      this.x = Math.random() * SCREEN_WIDTH;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [powerupStatus, setPowerupStatus] = useState("");

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
    laser: null as { x: number, width: number, active: boolean, duration: number } | null,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Space" && !gameOver) {
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
  }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize enemies
    gameState.current.enemies = Array.from({ length: 8 }, () => new Enemy());

    let animationFrameId: number;

    const gameLoop = () => {
      if (gameOver) return;

      // Update
      const { player, bullets, enemies, powerups, stars } = gameState.current;

      player.update(keys.current);
      bullets.forEach(b => b.update());
      enemies.forEach(e => e.update());
      powerups.forEach(p => p.update());
      stars.forEach(s => s.update());

      // Laser logic
      if (gameState.current.score >= 1000) {
        gameState.current.laserTimer++;
        if (gameState.current.laserTimer >= 600) { // 10 seconds
          gameState.current.laser = {
            x: Math.random() * (SCREEN_WIDTH - 60),
            width: 60,
            active: false,
            duration: 100 // Total life of laser event
          };
          gameState.current.laserTimer = 0;
        }
      }

      if (gameState.current.laser) {
        gameState.current.laser.duration--;
        if (gameState.current.laser.duration <= 40) {
          gameState.current.laser.active = true;
        }
        if (gameState.current.laser.duration <= 0) {
          gameState.current.laser = null;
        }

        if (gameState.current.laser && gameState.current.laser.active) {
          if (player.x < gameState.current.laser.x + gameState.current.laser.width &&
              player.x + player.width > gameState.current.laser.x) {
            player.health -= 1;
            setHealth(player.health);
            if (player.health <= 0) setGameOver(true);
          }
        }
      }

      // Boss spawn and update
      if (gameState.current.score >= 2000 && !gameState.current.boss) {
        gameState.current.boss = new Boss();
      }

      if (gameState.current.boss) {
        gameState.current.boss.update(bullets);
      }

      // Bullet collisions
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.y < 0 || b.y > SCREEN_HEIGHT) {
          bullets.splice(i, 1);
          continue;
        }

        // Boss collision
        if (gameState.current.boss && 
            b.color === BULLET_COLOR &&
            b.x < gameState.current.boss!.x + gameState.current.boss!.width &&
            b.x + b.width > gameState.current.boss!.x &&
            b.y < gameState.current.boss!.y + gameState.current.boss!.height &&
            b.y + b.height > gameState.current.boss!.y) {
          
          bullets.splice(i, 1);
          gameState.current.boss!.health--;
          if (gameState.current.boss!.health <= 0) {
            gameState.current.score += 500;
            setScore(gameState.current.score);
            gameState.current.boss = null;
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

            // Drop powerup
            if (Math.random() < 0.2) {
              const type = Math.random() < 0.5 ? "triple" : "health";
              powerups.push(new PowerUp(e.x + e.width / 2, e.y + e.height / 2, type));
            }

            // Replace enemy
            const speedMod = 1 + Math.min(Math.floor(gameState.current.score / 1000), 2);
            enemies[j] = new Enemy(speedMod);
            break;
          }
        }
      }

      // Powerup collisions
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
          }
          powerups.splice(i, 1);
        }
      }

      // Enemy collisions with player
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
          // Reset enemy
          enemies[i] = new Enemy(1 + Math.min(Math.floor(gameState.current.score / 1000), 2));
          if (player.health <= 0) {
            setGameOver(true);
          }
          break;
        }
      }

      // Check for boss bullets hitting player
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.color === ENEMY_BULLET_COLOR &&
            player.x < b.x + b.width &&
            player.x + player.width > b.x &&
            player.y < b.y + b.height &&
            player.y + player.height > b.y) {
          
          bullets.splice(i, 1);
          player.health -= 2;
          setHealth(player.health);
          if (player.health <= 0) {
            setGameOver(true);
          }
        }
      }

      // Update UI state
      setPowerupStatus(player.powerupActive === "triple" ? `TRIPLE (${Math.ceil(player.powerupTimer / 60)}s)` : "");

      // Draw
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      stars.forEach(s => s.draw(ctx));
      player.draw(ctx);
      bullets.forEach(b => b.draw(ctx));
      enemies.forEach(e => e.draw(ctx));
      powerups.forEach(p => p.draw(ctx));
      
      if (gameState.current.boss) {
        gameState.current.boss.draw(ctx);
      }

      if (gameState.current.laser) {
        ctx.fillStyle = gameState.current.laser.active ? "red" : "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(gameState.current.laser.x, 0, gameState.current.laser.width, SCREEN_HEIGHT);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver]);

  const resetGame = () => {
    gameState.current = {
      player: new Player(),
      bullets: [],
      enemies: Array.from({ length: 8 }, () => new Enemy()),
      powerups: [],
      stars: Array.from({ length: 50 }, () => new Star()),
      boss: null,
      score: 0,
    };
    setScore(0);
    setHealth(3);
    setGameOver(false);
    setPowerupStatus("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono">
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

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
            <h1 className="text-6xl text-red-600 font-bold mb-4">GAME OVER</h1>
            <p className="text-2xl mb-8">Score: {score}</p>
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xl rounded-lg transition-colors"
            >
              CLICK TO PLAY AGAIN
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 text-gray-400">
        Use Arrow Keys to move and Space to shoot
      </div>
    </div>
  );
}
