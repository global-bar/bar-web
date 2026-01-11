// World state and entity management

export type Vec2 = { x: number; y: number };

export type Direction = 'down' | 'up' | 'left' | 'right';

export type UserEntity = {
  userId: string;
  nickname?: string;
  avatar?: { skin?: string; color?: string };

  // Authoritative position from server
  pos: Vec2;

  // Render position for smooth interpolation
  renderPos: Vec2;

  // Previous render position for direction calculation
  prevRenderPos: Vec2;

  // Facing direction
  direction: Direction;

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
  // Store previous position for direction calculation
  entity.prevRenderPos.x = entity.renderPos.x;
  entity.prevRenderPos.y = entity.renderPos.y;

  entity.renderPos.x = lerp(entity.renderPos.x, entity.pos.x, alpha);
  entity.renderPos.y = lerp(entity.renderPos.y, entity.pos.y, alpha);

  // Update direction based on movement
  const dx = entity.renderPos.x - entity.prevRenderPos.x;
  const dy = entity.renderPos.y - entity.prevRenderPos.y;
  const threshold = 0.1;

  if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
    if (Math.abs(dx) > Math.abs(dy)) {
      entity.direction = dx > 0 ? 'right' : 'left';
    } else {
      entity.direction = dy > 0 ? 'down' : 'up';
    }
  }
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
    prevRenderPos: { x, y },
    direction: 'down',
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
