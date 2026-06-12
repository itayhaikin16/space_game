import { 
  SCREEN_WIDTH, 
  SCREEN_HEIGHT, 
  BG_COLOR,
  BULLET_COLOR, 
  ENEMY_BULLET_COLOR, 
  Player, 
  Bullet, 
  PowerUp, 
  Enemy, 
  Boss, 
  Star, 
  Laser, 
  Asteroid,
  PLAYER_SKINS,
  ASTEROID_SKINS,
  PlayerSkinKey,
  AsteroidSkinKey
} from './game-logic';

export interface Notification {
  text: string;
  duration: number;
  color: string;
}

export interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  asteroids: Asteroid[];
  powerups: PowerUp[];
  stars: Star[];
  boss: Boss | null;
  score: number;
  laserTimer: number;
  laser: Laser | null;
  sidewaysLaserTimer: number;
  sidewaysLaser: Laser | null;
  bossRespawnTimer: number;
  vaporizerX: number;
  vaporizerDir: number;
  lastOrbSpawnDistance: number;
  notifications: Notification[];
  playerSkin: PlayerSkinKey;
  asteroidSkin: AsteroidSkinKey;
}

export function initGameState(): GameState {
  return {
    player: new Player(),
    bullets: [],
    enemies: [],
    asteroids: [],
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
    lastOrbSpawnDistance: 0,
    notifications: [],
    playerSkin: 'default',
    asteroidSkin: 'default',
  };
}

export function updateGame(state: GameState, keys: Record<string, boolean>, mode: "Shooter" | "Survival", 
                           onScoreChange: (s: number) => void, onHealthChange: (h: number) => void, 
                           onGameOver: () => void) {
  const { player, bullets, enemies, asteroids, powerups, stars } = state;

  player.update(keys);
  stars.forEach(s => s.update());
  powerups.forEach(p => p.update());
  bullets.forEach(b => b.update());

  // Update notifications
  state.notifications = state.notifications.filter(n => {
    n.duration--;
    return n.duration > 0;
  });

  // Shared Hazards: Lasers (Both modes)
  if (state.score >= 1000) {
    state.laserTimer++;
    if (state.laserTimer >= 600) {
      state.laser = new Laser('vertical', Math.random() * (SCREEN_WIDTH - 60));
      state.laserTimer = 0;
    }
  }
  if (state.score >= 10000) {
    state.sidewaysLaserTimer++;
    if (state.sidewaysLaserTimer >= 900) {
      state.sidewaysLaser = new Laser('sideways', Math.random() * (SCREEN_HEIGHT - 60), 160);
      state.sidewaysLaserTimer = 0;
    }
  }

  if (state.laser) {
    state.laser.update();
    if (state.laser.duration <= 0) state.laser = null;
    else if (state.laser.collidesWith(player.x, player.y, player.width, player.height)) {
      player.health -= 1;
      onHealthChange(player.health);
      if (player.health <= 0) onGameOver();
    }
  }
  if (state.sidewaysLaser) {
    state.sidewaysLaser.update();
    if (state.sidewaysLaser.duration <= 0) state.sidewaysLaser = null;
    else if (state.sidewaysLaser.collidesWith(player.x, player.y, player.width, player.height)) {
      player.health -= 1;
      onHealthChange(player.health);
      if (player.health <= 0) onGameOver();
    }
  }

  // Shared Hazards: Boss (Both modes)
  if (!state.boss && state.score >= 2000) {
    if (state.bossRespawnTimer > 0) state.bossRespawnTimer--;
    else {
      state.boss = new Boss();
      state.notifications.push({
        text: "boss is here",
        duration: 180,
        color: "red"
      });
    }
  }
  if (state.boss) state.boss.update(bullets);

  if (mode === "Shooter") {
    enemies.forEach(e => e.update());

    if (player.powerupActive === "vaporizer") {
      state.vaporizerX += 12 * state.vaporizerDir;
      if (state.vaporizerX <= 0) {
        state.vaporizerX = 0;
        state.vaporizerDir = 1;
      } else if (state.vaporizerX >= SCREEN_WIDTH) {
        state.vaporizerX = SCREEN_WIDTH;
        state.vaporizerDir = -1;
      }
      const beamHalfWidth = 20;
      const beamLeft = state.vaporizerX - beamHalfWidth;
      const beamRight = state.vaporizerX + beamHalfWidth;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (beamLeft < e.x + e.width && beamRight > e.x) {
          enemies.splice(i, 1);
          state.score += 10;
          onScoreChange(state.score);
          if (Math.random() < 0.2) {
            const type = Math.random() < 0.5 ? "triple" : "health";
            powerups.push(new PowerUp(e.x + e.width / 2, e.y + e.height / 2, type));
          }
          const speedMod = 1 + Math.min(Math.floor(state.score / 1000), 2);
          enemies.push(new Enemy(speedMod));
        }
      }
      if (state.boss) {
        const b = state.boss;
        if (beamLeft < b.x + b.width && beamRight > b.x) {
          b.health -= 2;
        }
      }
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
        player.health--;
        onHealthChange(player.health);
        enemies[i] = new Enemy(1 + Math.min(Math.floor(state.score / 1000), 2));
        if (player.health <= 0) onGameOver();
        break;
      }
    }
  } else {
    let speedMod = 1.0;
    if (state.score < 1000) {
      speedMod += Math.floor(state.score / 50) * 0.1;
    } else if (state.score < 2000) {
      speedMod += (1000 / 50) * 0.1 + Math.floor((state.score - 1000) / 100) * 0.1;
    } else {
      speedMod += (1000 / 50) * 0.1 + (1000 / 100) * 0.1 + Math.floor((state.score - 2000) / 150) * 0.1;
    }

    asteroids.forEach(a => {
      a.update(speedMod);
      if (a.y > SCREEN_HEIGHT) {
        a.y = Math.random() * -200 - 50;
        a.x = Math.random() * (SCREEN_WIDTH - a.width);
      }
      if (player.x < a.x + a.width && player.x + player.width > a.x && player.y < a.y + a.height && player.y + player.height > a.y) {
        player.health -= 1;
        onHealthChange(player.health);
        a.y = Math.random() * -200 - 50;
        a.x = Math.random() * (SCREEN_WIDTH - a.width);
        if (player.health <= 0) onGameOver();
      }
    });

    if (state.score - state.lastOrbSpawnDistance >= 50) {
      const type = Math.random() < 0.95 ? "health" : "superhealth";
      powerups.push(new PowerUp(Math.random() * (SCREEN_WIDTH - 40) + 20, Math.random() * -40 - 10, type));
      state.lastOrbSpawnDistance = state.score;
    }

    state.score += 0.05;
    onScoreChange(Math.floor(state.score));
  }

  // Process Bullets (Shared: Boss damage and Enemy damage)
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.y < 0 || b.y > SCREEN_HEIGHT) { bullets.splice(i, 1); continue; }
    
    if (state.boss && b.color === BULLET_COLOR && 
        b.x < state.boss!.x + state.boss!.width &&
        b.x + b.width > state.boss!.x &&
        b.y < state.boss!.y + state.boss!.height &&
        b.y + b.height > state.boss!.y) {
      bullets.splice(i, 1);
      state.boss!.health -= 10;
      if (state.boss!.health <= 0) {
        state.score += 500;
        onScoreChange(state.score);
        powerups.push(new PowerUp(state.boss!.x + state.boss!.width / 2, state.boss!.y + state.boss!.height / 2, "vaporizer"));
        state.boss = null;
        state.bossRespawnTimer = 7200;
      }
      continue;
    }

    if (mode === "Shooter") {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (b.color === BULLET_COLOR && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          bullets.splice(i, 1);
          state.score += 10;
          onScoreChange(state.score);
          if (Math.random() < 0.2) {
            const type = Math.random() < 0.5 ? "triple" : "health";
            powerups.push(new PowerUp(e.x + e.width / 2, e.y + e.height / 2, type));
          }
          const speedMod = 1 + Math.min(Math.floor(state.score / 1000), 2);
          enemies[j] = new Enemy(speedMod);
          break;
        }
      }
    }
  }

  // Player Collision with Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.color === ENEMY_BULLET_COLOR && player.x < b.x + b.width && player.x + player.width > b.x && player.y < b.y + b.height && player.y + player.height > b.y) {
      bullets.splice(i, 1);
      player.health -= 1;
      onHealthChange(player.health);
      if (player.health <= 0) onGameOver();
    }
  }

  // Powerup Collection (Shared)
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (p.y > SCREEN_HEIGHT) { powerups.splice(i, 1); continue; }
    if (player.x < p.x + p.width && player.x + player.width > p.x && player.y < p.y + p.height && player.y + player.height > p.y) {
      if (p.type === "triple") { player.powerupActive = "triple"; player.powerupTimer = 300; }
      else if (p.type === "health") { player.health++; onHealthChange(player.health); }
      else if (p.type === "superhealth") { player.health += 2; onHealthChange(player.health); }
      else if (p.type === "vaporizer") { player.powerupActive = "vaporizer"; player.powerupTimer = 480; }
      powerups.splice(i, 1);
    }
  }
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState, mode: "Shooter" | "Survival") {
  const { player, bullets, enemies, asteroids, powerups, stars } = state;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  stars.forEach(s => s.draw(ctx));
  player.draw(ctx, PLAYER_SKINS[state.playerSkin].color);

  if (mode === "Shooter") {
    bullets.forEach(b => b.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    powerups.forEach(p => p.draw(ctx));
    if (state.boss) {
      state.boss.draw(ctx);
      const boss = state.boss;
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
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`HP: ${Math.max(0, Math.ceil(boss.health))}`, x + barWidth / 2, y - 5);
    }
    if (state.laser) {
      ctx.fillStyle = state.laser.active ? "red" : "rgba(255, 0, 0, 0.3)";
      ctx.fillRect(state.laser.x, 0, state.laser.width, SCREEN_HEIGHT);
    }
    if (state.sidewaysLaser) {
      ctx.fillStyle = state.sidewaysLaser.active ? "red" : "rgba(255, 0, 0, 0.3)";
      ctx.fillRect(0, state.sidewaysLaser.y, SCREEN_WIDTH, state.sidewaysLaser.height);
    }
  } else {
    asteroids.forEach(a => a.draw(ctx, ASTEROID_SKINS[state.asteroidSkin].color));
    powerups.forEach(p => p.draw(ctx));
  }

  if (player.powerupActive === "vaporizer") {
    const vX = state.vaporizerX;
    ctx.fillStyle = "rgba(255, 0, 255, 0.4)";
    ctx.fillRect(vX - 20, 0, 40, SCREEN_HEIGHT);
    ctx.strokeStyle = "#FF00FF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vX, 0);
    ctx.lineTo(vX, SCREEN_HEIGHT);
    ctx.stroke();
  }

  // Draw Notifications
  state.notifications.forEach((n, i) => {
    const alpha = n.duration / 180; // fade out
    ctx.fillStyle = n.color === "red" ? `rgba(255, 0, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    
    // Flashing effect (every 10 frames)
    if (Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.fillText(n.text, SCREEN_WIDTH / 2, 100 + i * 50);
    }
  });
}
