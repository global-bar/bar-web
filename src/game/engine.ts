// Game loop engine

import { stepInterpolation, cleanExpiredBubbles, type WorldState } from './world';
import { renderWorld } from './render';

export type GameEngine = {
  start: () => void;
  stop: () => void;
  getCanvas: () => HTMLCanvasElement;
};

export function createGameEngine(
  canvas: HTMLCanvasElement,
  getWorld: () => WorldState,
  _dpr: number = 1
): GameEngine {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;

  let animationId: number | null = null;
  let lastTime = 0;

  const tick = (timestamp: number) => {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const world = getWorld();

    // Update interpolation for all users
    for (const user of Object.values(world.users)) {
      // Adjust alpha based on frame time for consistent smoothness
      const alpha = Math.min(0.3, deltaTime / 50);
      stepInterpolation(user, alpha);
    }

    // Clean expired bubbles
    cleanExpiredBubbles(world.users);

    // Render
    renderWorld(ctx, world);

    // Continue loop
    animationId = requestAnimationFrame(tick);
  };

  return {
    start: () => {
      if (animationId !== null) return;
      lastTime = performance.now();
      animationId = requestAnimationFrame(tick);
    },
    stop: () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    getCanvas: () => canvas,
  };
}
