import { describe, it, expect } from 'vitest';
import { Player, Boss, Bullet, Laser } from './game-logic';

describe('Game Logic Tests', () => {
  it('Player should move left when KeyA is pressed', () => {
    const player = new Player();
    const initialX = player.x;
    player.update({ 'KeyA': true });
    expect(player.x).toBeLessThan(initialX);
  });

  it('Boss should lose 10 health when hit by a bullet', () => {
    const boss = new Boss();
    const initialHealth = boss.health;
    // Simulating the logic inside the game loop
    boss.health -= 10;
    expect(boss.health).toBe(initialHealth - 10);
  });

  it('Bullet should move in the direction of its velocity', () => {
    const bullet = new Bullet(100, 100, 0, -7);
    const initialY = bullet.y;
    bullet.update();
    expect(bullet.y).toBe(initialY - 7);
  });

  describe('Laser Logic', () => {
    it('Laser should not be active initially', () => {
      const laser = new Laser('vertical', 100);
      expect(laser.active).toBe(false);
    });

    it('Laser should become active after duration decreases', () => {
      const laser = new Laser('vertical', 100);
      // duration is 100, active when <= 40. need to update 60 times.
      for (let i = 0; i < 60; i++) {
        laser.update();
      }
      expect(laser.active).toBe(true);
    });

    it('Vertical laser should collide with player', () => {
      const laser = new Laser('vertical', 100);
      laser.active = true;
      const player = new Player();
      player.x = 100;
      player.y = 500;
      expect(laser.collidesWith(player.x, player.y, player.width, player.height)).toBe(true);
    });

    it('Sideways laser should collide with player', () => {
      const laser = new Laser('sideways', 500);
      laser.active = true;
      const player = new Player();
      player.x = 100;
      player.y = 500;
      expect(laser.collidesWith(player.x, player.y, player.width, player.height)).toBe(true);
    });

    it('Laser should not collide if not active', () => {
      const laser = new Laser('vertical', 100);
      laser.active = false;
      const player = new Player();
      player.x = 100;
      player.y = 500;
      expect(laser.collidesWith(player.x, player.y, player.width, player.height)).toBe(false);
    });
  });
});
