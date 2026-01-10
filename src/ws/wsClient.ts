import type { Envelope } from './types';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

type Handlers = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  onMessage?: (msg: Envelope) => void;
  onStateChange?: (state: ConnectionState) => void;
};

export class WSClient {
  #ws?: WebSocket;
  #reconnectTimer?: number;
  #attempt = 0;
  #maxAttempts = 10;
  #state: ConnectionState = 'disconnected';
  #url: string;
  #handlers: Handlers;

  constructor(url: string, handlers: Handlers) {
    this.#url = url;
    this.#handlers = handlers;
  }

  connect() {
    this.#cleanup();
    this.#setState('connecting');

    try {
      this.#ws = new WebSocket(this.#url);
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      this.#setState('disconnected');
      this.#scheduleReconnect();
      return;
    }

    this.#ws.onopen = () => {
      this.#attempt = 0;
      this.#setState('connected');
      this.#handlers.onOpen?.();
    };

    this.#ws.onclose = () => {
      this.#handlers.onClose?.();
      this.#scheduleReconnect();
    };

    this.#ws.onerror = (e) => {
      this.#handlers.onError?.(e);
    };

    this.#ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as Envelope;
        this.#handlers.onMessage?.(msg);
      } catch {
        console.warn('Failed to parse WebSocket message:', evt.data);
      }
    };
  }

  send<T>(env: Envelope<T>) {
    if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.#ws.send(JSON.stringify(env));
    return true;
  }

  close() {
    this.#cleanup();
    this.#ws?.close();
    this.#ws = undefined;
    this.#setState('disconnected');
  }

  getState(): ConnectionState {
    return this.#state;
  }

  isConnected(): boolean {
    return this.#ws?.readyState === WebSocket.OPEN;
  }

  #setState(state: ConnectionState) {
    this.#state = state;
    this.#handlers.onStateChange?.(state);
  }

  #scheduleReconnect() {
    if (this.#attempt >= this.#maxAttempts) {
      this.#setState('disconnected');
      return;
    }

    this.#setState('reconnecting');
    const delay = Math.min(5000, 500 * Math.pow(2, this.#attempt++));
    this.#reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }

  #cleanup() {
    if (this.#reconnectTimer) {
      window.clearTimeout(this.#reconnectTimer);
      this.#reconnectTimer = undefined;
    }
  }
}

// Helper to create envelope with defaults
export function createEnvelope<T>(
  type: string,
  payload: T,
  options: { roomId?: string; userId?: string } = {}
): Envelope<T> {
  return {
    v: 1,
    type,
    eventId: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ...options,
    payload,
  };
}
