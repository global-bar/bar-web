// WebSocket Protocol Types for global-bar-ws-protocol-minimal-v1

export type Envelope<T = unknown> = {
  v: 1;
  type: string;
  eventId?: string;
  roomId?: string;
  userId?: string;
  seq?: number;
  ts?: string;
  payload?: T;
};

// Client -> Server Payloads
export type JoinPayload = {
  nickname: string;
  avatar?: { skin?: string; color?: string };
};

export type MoveIntentPayload = {
  keys: { up: boolean; down: boolean; left: boolean; right: boolean };
  clientTick: number;
};

export type ChatSayPayload = {
  text: string;
  bubbleTtlMs?: number;
};

// Server -> Client Payloads
export type JoinAckPayload = {
  userId: string;
  tickRate: number;
  moveLimitHz: number;
  chatRadius?: number;
  world: { w: number; h: number };
};

export type UserData = {
  userId: string;
  x: number;
  y: number;
  nickname?: string;
  avatar?: { skin?: string; color?: string };
};

export type SnapshotPayload = {
  you: UserData;
  users: UserData[];
};

export type UserJoinedPayload = {
  user: UserData;
};

export type UserLeftPayload = {
  userId: string;
};

export type UserMovedPayload = {
  userId: string;
  x: number;
  y: number;
  serverTick?: number;
};

export type ChatMessagePayload = {
  messageId: string;
  fromUserId: string;
  text: string;
  at: string;
  bubbleTtlMs?: number;
};

export type ErrorPayload = {
  code: string;
  message: string;
};

// Message type constants
export const MessageTypes = {
  // Client -> Server
  JOIN: 'join',
  MOVE_INTENT: 'move.intent',
  CHAT_SAY: 'chat.say',
  PING: 'ping',

  // Server -> Client
  JOIN_ACK: 'join.ack',
  SNAPSHOT: 'snapshot',
  USER_JOINED: 'user.joined',
  USER_LEFT: 'user.left',
  USER_MOVED: 'user.moved',
  CHAT_MESSAGE: 'chat.message',
  PONG: 'pong',
  ERROR: 'error',
} as const;
