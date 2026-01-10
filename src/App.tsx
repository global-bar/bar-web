import { useState } from 'react';
import { useBarStore } from './store/useBarStore';
import { JoinScreen } from './ui/JoinScreen';
import { GameCanvas } from './ui/GameCanvas';
import { ChatBox } from './ui/ChatBox';
import { Hud } from './ui/Hud';

function App() {
  const [hasJoined, setHasJoined] = useState(false);
  const connectionState = useBarStore((s) => s.connectionState);
  const me = useBarStore((s) => s.world.me);

  // Show join screen if not joined or disconnected
  const showJoinScreen = !hasJoined || (connectionState === 'disconnected' && !me);

  if (showJoinScreen) {
    return <JoinScreen onJoin={() => setHasJoined(true)} />;
  }

  return (
    <div className="relative min-h-screen bg-[#070712] overflow-hidden">
      <GameCanvas />
      <Hud />
      <ChatBox />
    </div>
  );
}

export default App;
