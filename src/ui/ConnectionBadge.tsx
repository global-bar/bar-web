import { useBarStore } from '../store/useBarStore';

const stateConfig = {
  connected: { label: 'ONLINE', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
  connecting: { label: 'CONNECTING', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  reconnecting: { label: 'RECONNECTING', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  disconnected: { label: 'OFFLINE', className: 'bg-red-500/20 text-red-400 border-red-500/50' },
};

export function ConnectionBadge() {
  const connectionState = useBarStore((s) => s.connectionState);
  const config = stateConfig[connectionState];

  return (
    <div
      className={`
        px-3 py-1 text-xs font-mono border
        ${config.className}
      `}
    >
      <span className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse"
        style={{
          backgroundColor: connectionState === 'connected' ? '#22c55e' :
            connectionState === 'disconnected' ? '#ef4444' : '#eab308'
        }}
      />
      {config.label}
    </div>
  );
}
