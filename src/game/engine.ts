// Game loop engine

import { stepInterpolation, cleanExpiredBubbles, type WorldState } from './world';
import { renderWorld, initRenderAssets } from './render';

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
  ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering for sprites

  let animationId: number | null = null;
  let lastTime = 0;

  // Initialize render assets (non-blocking)
  initRenderAssets().catch(console.warn);

  const tick = (timestamp: number) => {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const world = getWorld();

    // Update interpolation for all users
    for (const user of Object.values(world.users)) {
      // Adjust alpha based on frame time for consistent smoothness
      // Higher alpha = faster interpolation toward target position
      const alpha = Math.min(0.9, deltaTime / 16);
      stepInterpolation(user, alpha);
    }

    // Clean expired bubbles
    cleanExpiredBubbles(world.users);

    // Render with deltaTime for animation
    renderWorld(ctx, world, deltaTime);

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
