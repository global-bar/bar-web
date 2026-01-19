import { useRef, useEffect } from 'react';
import { createGameEngine } from '../game/engine';
import { createKeyboardInput, isMoving, type Keys } from '../game/input';
import { useBarStore } from '../store/useBarStore';
import { BAR_TILEMAP } from '../game/tilemap/barMap';
import { canMoveTo } from '../game/tilemap/TilemapData';

// Base canvas size (matches server world size)
const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const world = useBarStore((s) => s.world);
  const sendMoveIntent = useBarStore((s) => s.sendMoveIntent);
  const serverRules = world.serverRules;

  // Store a ref to always get the latest world
  const worldRef = useRef(world);
  worldRef.current = world;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size (scaled for DPI)
    canvas.width = BASE_WIDTH * dpr;
    canvas.height = BASE_HEIGHT * dpr;

    // Get context and scale for DPI
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Create game engine
    const engine = createGameEngine(canvas, () => worldRef.current, dpr);
    engine.start();

    // Create keyboard input
    const input = createKeyboardInput();

    // 충돌 검사 후 이동 가능한 키만 필터링
    const filterBlockedKeys = (keys: Keys): Keys => {
      const me = worldRef.current.users[worldRef.current.me ?? ''];
      if (!me) return keys;

      const speed = 4; // 예상 이동 속도 (픽셀)
      const result: Keys = { up: false, down: false, left: false, right: false };

      // 각 방향별로 충돌 검사
      if (keys.up) {
        const canMove = canMoveTo(BAR_TILEMAP, me.pos.x, me.pos.y - speed);
        result.up = canMove;
      }
      if (keys.down) {
        const canMove = canMoveTo(BAR_TILEMAP, me.pos.x, me.pos.y + speed);
        result.down = canMove;
      }
      if (keys.left) {
        const canMove = canMoveTo(BAR_TILEMAP, me.pos.x - speed, me.pos.y);
        result.left = canMove;
      }
      if (keys.right) {
        const canMove = canMoveTo(BAR_TILEMAP, me.pos.x + speed, me.pos.y);
        result.right = canMove;
      }

      return result;
    };

    // Move intent sender (throttled based on server rules)
    const moveHz = serverRules?.moveLimitHz ?? 15;
    const moveInterval = setInterval(() => {
      if (isMoving(input.keys)) {
        const filteredKeys = filterBlockedKeys(input.keys);
        if (isMoving(filteredKeys)) {
          sendMoveIntent(filteredKeys);
        }
      }
    }, 1000 / moveHz);

    return () => {
      engine.stop();
      input.destroy();
      clearInterval(moveInterval);
    };
  }, [sendMoveIntent, serverRules?.moveLimitHz]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#070712] p-4">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          width: '100%',
          maxWidth: `min(calc(100vw - 2rem), ${BASE_WIDTH * 1.5}px)`,
          height: 'auto',
          aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`,
          border: '1px solid rgba(0, 255, 255, 0.3)',
          boxShadow: '0 0 24px rgba(255, 43, 214, 0.15), inset 0 0 60px rgba(0, 255, 255, 0.05)',
        }}
      />
    </div>
  );
}
