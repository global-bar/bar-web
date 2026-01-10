import { useState, useRef, useEffect } from 'react';
import { useBarStore } from '../store/useBarStore';

export function ChatBox() {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const sendChat = useBarStore((s) => s.sendChat);
  const chatMessages = useBarStore((s) => s.chatMessages);
  const connectionState = useBarStore((s) => s.connectionState);
  const me = useBarStore((s) => s.world.me);

  const isConnected = connectionState === 'connected';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle Enter key globally to focus chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setIsExpanded(true);
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    sendChat(input);
    setInput('');
  };

  const handleBlur = () => {
    if (!input) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md">
      {/* Messages */}
      {isExpanded && chatMessages.length > 0 && (
        <div
          ref={messagesRef}
          className="mb-2 max-h-32 overflow-y-auto bg-black/70 border border-cyan-500/30 p-2 text-xs font-mono"
        >
          {chatMessages.slice(-10).map((msg) => (
            <div key={msg.id} className="mb-1">
              <span className={msg.fromUserId === me ? 'text-green-400' : 'text-pink-400'}>
                {msg.nickname || msg.fromUserId.slice(0, 6)}:
              </span>
              <span className="text-white/90 ml-2">{msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onBlur={handleBlur}
          placeholder={isConnected ? "Press Enter to chat..." : "Not connected"}
          disabled={!isConnected}
          maxLength={100}
          className="
            flex-1 px-3 py-2
            bg-black/70 border border-cyan-500/30
            text-white text-sm font-mono
            placeholder:text-gray-500
            focus:outline-none focus:border-cyan-400
            disabled:opacity-50
          "
        />
        <button
          type="submit"
          disabled={!isConnected || !input.trim()}
          className="
            px-4 py-2
            bg-cyan-500/20 border border-cyan-500/50
            text-cyan-400 text-sm font-mono
            hover:bg-cyan-500/30
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          SEND
        </button>
      </form>
    </div>
  );
}
