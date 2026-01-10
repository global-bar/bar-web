import { useState } from 'react';
import { useBarStore } from '../store/useBarStore';

type Props = {
  onJoin: () => void;
};

export function JoinScreen({ onJoin }: Props) {
  const [localNickname, setLocalNickname] = useState(
    useBarStore.getState().nickname
  );
  const [roomId, setRoomId] = useState(
    import.meta.env.VITE_DEFAULT_ROOM_ID || 'main-bar'
  );
  const [wsUrl, setWsUrl] = useState(
    import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080'
  );

  const connect = useBarStore((s) => s.connect);
  const setNickname = useBarStore((s) => s.setNickname);
  const connectionState = useBarStore((s) => s.connectionState);

  const isConnecting = connectionState === 'connecting';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localNickname.trim() || !roomId.trim()) return;

    setNickname(localNickname.trim());
    connect(wsUrl, roomId.trim(), localNickname.trim());
    onJoin();
  };

  return (
    <div className="min-h-screen bg-[#070712] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-mono text-cyan-400 tracking-wider mb-2"
            style={{ textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>
            GLOBAL BAR
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            Enter the virtual bar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              NICKNAME
            </label>
            <input
              type="text"
              value={localNickname}
              onChange={(e) => setLocalNickname(e.target.value)}
              placeholder="Enter nickname..."
              maxLength={16}
              className="
                w-full px-3 py-2
                bg-black/50 border border-cyan-500/30
                text-white font-mono
                placeholder:text-gray-600
                focus:outline-none focus:border-cyan-400
              "
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              ROOM ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID..."
              maxLength={32}
              className="
                w-full px-3 py-2
                bg-black/50 border border-cyan-500/30
                text-white font-mono
                placeholder:text-gray-600
                focus:outline-none focus:border-cyan-400
              "
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              SERVER URL
            </label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost:8080"
              className="
                w-full px-3 py-2
                bg-black/50 border border-cyan-500/30
                text-white font-mono text-sm
                placeholder:text-gray-600
                focus:outline-none focus:border-cyan-400
              "
            />
          </div>

          <button
            type="submit"
            disabled={isConnecting || !localNickname.trim() || !roomId.trim()}
            className="
              w-full py-3 mt-6
              bg-cyan-500/20 border border-cyan-500/50
              text-cyan-400 font-mono text-lg tracking-wider
              hover:bg-cyan-500/30 hover:border-cyan-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
            style={{ textShadow: '0 0 10px rgba(0,255,255,0.5)' }}
          >
            {isConnecting ? 'CONNECTING...' : 'ENTER BAR'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-xs font-mono text-gray-600">
          Use WASD or Arrow keys to move
        </div>
      </div>
    </div>
  );
}
