// World state and entity management

export type Vec2 = { x: number; y: number };

export type UserEntity = {
  userId: string;
  nickname?: string;
  avatar?: { skin?: string; color?: string };

  // Authoritative position from server
  pos: Vec2;

  // Render position for smooth interpolation
  renderPos: Vec2;

  // Chat bubble
  bubble?: { text: string; expiresAtMs: number };
};

export type ServerRules = {
  tickRate: number;
  moveLimitHz: number;
  chatRadius?: number;
};

export type WorldState = {
  roomId: string;
  me?: string; // My userId
  worldSize: { w: number; h: number };
  users: Record<string, UserEntity>;
  serverRules?: ServerRules;
};

// Linear interpolation
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// Step interpolation for smooth movement
export function stepInterpolation(entity: UserEntity, alpha = 0.25): void {
  entity.renderPos.x = lerp(entity.renderPos.x, entity.pos.x, alpha);
  entity.renderPos.y = lerp(entity.renderPos.y, entity.pos.y, alpha);
}

// Create a new user entity
export function createUserEntity(
  userId: string,
  x: number,
  y: number,
  nickname?: string,
  avatar?: { skin?: string; color?: string }
): UserEntity {
  return {
    userId,
    nickname,
    avatar,
    pos: { x, y },
    renderPos: { x, y },
  };
}

// Create initial world state
export function createWorldState(roomId: string): WorldState {
  return {
    roomId,
    worldSize: { w: 320, h: 180 }, // Default, will be updated from server
    users: {},
  };
}

// Clean expired bubbles
export function cleanExpiredBubbles(users: Record<string, UserEntity>): void {
  const now = Date.now();
  for (const user of Object.values(users)) {
    if (user.bubble && user.bubble.expiresAtMs <= now) {
      user.bubble = undefined;
    }
  }
}
