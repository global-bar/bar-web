import { useBarStore } from '../store/useBarStore';
import { ConnectionBadge } from './ConnectionBadge';

export function Hud() {
  const world = useBarStore((s) => s.world);
  const nickname = useBarStore((s) => s.nickname);
  const userCount = Object.keys(world.users).length;

  return (
    <>
      {/* Top-right: Connection status */}
      <div className="fixed top-4 right-4 flex flex-col items-end gap-2">
        <ConnectionBadge />

        {world.me && (
          <div className="text-xs font-mono text-gray-400 bg-black/50 px-2 py-1 border border-gray-700/50">
            <div>Room: <span className="text-cyan-400">{world.roomId || 'N/A'}</span></div>
            <div>You: <span className="text-green-400">{nickname}</span></div>
            <div>Users: <span className="text-pink-400">{userCount}</span></div>
          </div>
        )}
      </div>

      {/* Top-left: Controls help */}
      <div className="fixed top-4 left-4">
        <div className="text-xs font-mono text-gray-500 bg-black/50 px-2 py-1 border border-gray-700/50">
          <div className="text-cyan-400 mb-1">CONTROLS</div>
          <div>Move: <span className="text-white">WASD</span> / <span className="text-white">Arrows</span></div>
          <div>Chat: <span className="text-white">Enter</span></div>
        </div>
      </div>
    </>
  );
}
