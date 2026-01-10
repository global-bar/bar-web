// Zustand store for global state management

import { create } from 'zustand';
import { WSClient, createEnvelope, type ConnectionState } from '../ws/wsClient';
import {
  type Envelope,
  type JoinPayload,
  type JoinAckPayload,
  type SnapshotPayload,
  type UserJoinedPayload,
  type UserLeftPayload,
  type UserMovedPayload,
  type ChatMessagePayload,
  type ChatSayPayload,
  type MoveIntentPayload,
  type ErrorPayload,
  MessageTypes,
} from '../ws/types';
import {
  createWorldState,
  createUserEntity,
  type WorldState,
} from '../game/world';
import type { Keys } from '../game/input';

type BarState = {
  // Connection
  connectionState: ConnectionState;
  wsClient: WSClient | null;

  // World
  world: WorldState;

  // User info
  nickname: string;

  // Chat
  chatMessages: Array<{
    id: string;
    fromUserId: string;
    nickname?: string;
    text: string;
    at: string;
  }>;

  // Actions
  connect: (wsUrl: string, roomId: string, nickname: string) => void;
  disconnect: () => void;
  sendMoveIntent: (keys: Keys) => void;
  sendChat: (text: string) => void;
  setNickname: (nickname: string) => void;
};

const DEFAULT_BUBBLE_TTL = 3000;

export const useBarStore = create<BarState>((set, get) => ({
  // Initial state
  connectionState: 'disconnected',
  wsClient: null,
  world: createWorldState(''),
  nickname: `user-${Math.random().toString(36).slice(2, 6)}`,
  chatMessages: [],

  setNickname: (nickname: string) => set({ nickname }),

  connect: (wsUrl: string, roomId: string, nickname: string) => {
    const { wsClient: existingClient } = get();
    if (existingClient) {
      existingClient.close();
    }

    const fullUrl = `${wsUrl}/ws/rooms/${roomId}`;

    const client = new WSClient(fullUrl, {
      onOpen: () => {
        // Send join message
        client.send(
          createEnvelope<JoinPayload>(MessageTypes.JOIN, {
            nickname,
            avatar: { skin: 'default', color: 'cyan' },
          }, { roomId })
        );
      },
      onClose: () => {
        console.log('WebSocket closed');
      },
      onError: (e) => {
        console.error('WebSocket error:', e);
      },
      onStateChange: (state) => {
        set({ connectionState: state });
      },
      onMessage: (msg: Envelope) => {
        handleMessage(msg, set, get);
      },
    });

    set({
      wsClient: client,
      world: createWorldState(roomId),
      nickname,
      chatMessages: [],
    });

    client.connect();
  },

  disconnect: () => {
    const { wsClient } = get();
    if (wsClient) {
      wsClient.close();
    }
    set({
      wsClient: null,
      connectionState: 'disconnected',
      world: createWorldState(''),
    });
  },

  sendMoveIntent: (keys: Keys) => {
    const { wsClient, world } = get();
    if (!wsClient || !world.me) return;

    wsClient.send(
      createEnvelope<MoveIntentPayload>(MessageTypes.MOVE_INTENT, {
        keys,
        clientTick: Date.now(),
      }, { roomId: world.roomId, userId: world.me })
    );
  },

  sendChat: (text: string) => {
    const { wsClient, world } = get();
    if (!wsClient || !world.me || !text.trim()) return;

    wsClient.send(
      createEnvelope<ChatSayPayload>(MessageTypes.CHAT_SAY, {
        text: text.trim(),
        bubbleTtlMs: DEFAULT_BUBBLE_TTL,
      }, { roomId: world.roomId, userId: world.me })
    );
  },
}));

// Message handler
function handleMessage(
  msg: Envelope,
  set: (state: Partial<BarState> | ((state: BarState) => Partial<BarState>)) => void,
  _get: () => BarState
) {
  switch (msg.type) {
    case MessageTypes.JOIN_ACK: {
      const payload = msg.payload as JoinAckPayload;
      set((state) => ({
        world: {
          ...state.world,
          me: payload.userId,
          worldSize: payload.world,
          serverRules: {
            tickRate: payload.tickRate,
            moveLimitHz: payload.moveLimitHz,
            chatRadius: payload.chatRadius,
          },
        },
      }));
      break;
    }

    case MessageTypes.SNAPSHOT: {
      const payload = msg.payload as SnapshotPayload;
      const users: WorldState['users'] = {};

      // Add self
      users[payload.you.userId] = createUserEntity(
        payload.you.userId,
        payload.you.x,
        payload.you.y,
        payload.you.nickname,
        payload.you.avatar
      );

      // Add others
      for (const u of payload.users) {
        users[u.userId] = createUserEntity(
          u.userId,
          u.x,
          u.y,
          u.nickname,
          u.avatar
        );
      }

      set((state) => ({
        world: {
          ...state.world,
          users,
        },
      }));
      break;
    }

    case MessageTypes.USER_JOINED: {
      const payload = msg.payload as UserJoinedPayload;
      set((state) => ({
        world: {
          ...state.world,
          users: {
            ...state.world.users,
            [payload.user.userId]: createUserEntity(
              payload.user.userId,
              payload.user.x,
              payload.user.y,
              payload.user.nickname,
              payload.user.avatar
            ),
          },
        },
      }));
      break;
    }

    case MessageTypes.USER_LEFT: {
      const payload = msg.payload as UserLeftPayload;
      set((state) => {
        const { [payload.userId]: _, ...remainingUsers } = state.world.users;
        return {
          world: {
            ...state.world,
            users: remainingUsers,
          },
        };
      });
      break;
    }

    case MessageTypes.USER_MOVED: {
      const payload = msg.payload as UserMovedPayload;
      set((state) => {
        const user = state.world.users[payload.userId];
        if (!user) {
          // User not found, might be a late join - create them
          return {
            world: {
              ...state.world,
              users: {
                ...state.world.users,
                [payload.userId]: createUserEntity(
                  payload.userId,
                  payload.x,
                  payload.y
                ),
              },
            },
          };
        }

        return {
          world: {
            ...state.world,
            users: {
              ...state.world.users,
              [payload.userId]: {
                ...user,
                pos: { x: payload.x, y: payload.y },
              },
            },
          },
        };
      });
      break;
    }

    case MessageTypes.CHAT_MESSAGE: {
      const payload = msg.payload as ChatMessagePayload;
      const ttl = payload.bubbleTtlMs ?? DEFAULT_BUBBLE_TTL;

      set((state) => {
        const user = state.world.users[payload.fromUserId];

        // Add to chat history
        const newMessage = {
          id: payload.messageId,
          fromUserId: payload.fromUserId,
          nickname: user?.nickname,
          text: payload.text,
          at: payload.at,
        };

        // Keep only last 50 messages
        const chatMessages = [...state.chatMessages, newMessage].slice(-50);

        // Update user bubble if user exists
        if (user) {
          return {
            chatMessages,
            world: {
              ...state.world,
              users: {
                ...state.world.users,
                [payload.fromUserId]: {
                  ...user,
                  bubble: {
                    text: payload.text,
                    expiresAtMs: Date.now() + ttl,
                  },
                },
              },
            },
          };
        }

        return { chatMessages };
      });
      break;
    }

    case MessageTypes.ERROR: {
      const payload = msg.payload as ErrorPayload;
      console.error('Server error:', payload.code, payload.message);
      break;
    }

    case MessageTypes.PONG: {
      // Could calculate RTT here
      break;
    }

    default:
      console.log('Unknown message type:', msg.type);
  }
}
