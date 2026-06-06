"use client";

export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
export const PLAYER_COLOR = "#00FF00";
export const ENEMY_COLOR = "#787878";
export const BULLET_COLOR = "#FFFF00";
export const BG_COLOR = "#0A0A1E";
export const POWERUP_COLOR_TRIPLE = "#00C8FF";
export const POWERUP_COLOR_HEALTH = "#00FF64";
export const POWERUP_COLOR_VAPORIZER = "#FF00FF";
export const ENEMY_BULLET_COLOR = "#FF00FF";

export class Player {
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
    if ((keys["ArrowLeft"] || keys["KeyA"]) && this.x > 0) this.x -= this.speed;
    if ((keys["ArrowRight"] || keys["KeyD"]) && this.x + this.width < SCREEN_WIDTH) this.x += this.speed;
    if ((keys["ArrowUp"] || keys["KeyW"]) && this.y > 0) this.y -= this.speed;
    if ((keys["ArrowDown"] || keys["KeyS"]) && this.y + this.height < SCREEN_HEIGHT) this.y += this.speed;

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

    ctx.fillStyle = "#C8C8FF";
    ctx.beginPath();
    ctx.arc(this.x + 25, this.y + 15, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x + 5, this.y + 35);
    ctx.lineTo(this.x + 45, this.y + 35);
    ctx.stroke();
  }
}

export class Bullet {
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

export class PowerUp {
  x: number;
  y: number;
  width: number = 20;
  height: number = 20;
  type: "triple" | "health" | "vaporizer";
  speed: number = 3;

  constructor(x: number, y: number, type: "triple" | "health" | "vaporizer") {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.type = type;
  }

  update() {
    this.y += this.speed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.type === "triple" ? POWERUP_COLOR_TRIPLE : 
                    this.type === "health" ? POWERUP_COLOR_HEALTH : POWERUP_COLOR_VAPORIZER;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

export class Enemy {
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

export class Boss {
  x: number = SCREEN_WIDTH / 2 - 50;
  y: number = -100;
  width: number = 100;
  height: number = 60;
  health: number = 500;
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

export class Star {
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

export class Laser {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  active: boolean = false;
  duration: number;
  type: 'vertical' | 'sideways';

  constructor(type: 'vertical' | 'sideways', pos: number, duration = 100) {
    this.duration = duration;
    this.type = type;
    if (type === 'vertical') {
      this.x = pos;
      this.width = 60;
      this.height = SCREEN_HEIGHT;
    } else {
      this.y = pos;
      this.width = SCREEN_WIDTH;
      this.height = 60;
    }
  }

  update() {
    this.duration--;
    if (this.duration <= 40) {
      this.active = true;
    }
  }

  collidesWith(playerX: number, playerY: number, playerW: number, playerH: number): boolean {
    if (!this.active) return false;
    return (
      playerX < this.x + this.width &&
      playerX + playerW > this.x &&
      playerY < this.y + this.height &&
      playerY + playerH > this.y
    );
  }
}
