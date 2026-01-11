// Animation state machine for character sprites

export type Direction = 'down' | 'up' | 'left' | 'right';
export type AnimationState = 'idle' | 'walk';

export type AnimationConfig = {
  framesPerDirection: number;
  frameDurationMs: number;
  // Row for idle and walk states per direction
  idleRows: Record<Direction, number>;
  walkRows: Record<Direction, number>;
};

export class CharacterAnimator {
  private state: AnimationState = 'idle';
  private direction: Direction = 'down';
  private currentFrame = 0;
  private config: AnimationConfig;

  constructor(config: AnimationConfig) {
    this.config = config;
  }

  update(_deltaMs: number, isMoving: boolean, direction: Direction): void {
    this.state = isMoving ? 'walk' : 'idle';
    this.direction = direction;
    // 프레임은 외부에서 setFrame()으로 제어
  }

  getRow(): number {
    if (this.state === 'walk') {
      return this.config.walkRows[this.direction];
    }
    return this.config.idleRows[this.direction];
  }

  getColumn(): number {
    if (this.state === 'idle') {
      return 1; // 가만히 있을 때는 가운데 프레임
    }
    // 움직일 때: 0->0, 1->2 매핑 (첫 번째와 세 번째 프레임 번갈아 사용)
    return this.currentFrame === 0 ? 0 : 2;
  }

  getDirection(): Direction {
    return this.direction;
  }

  getState(): AnimationState {
    return this.state;
  }

  setFrame(frame: number): void {
    this.currentFrame = frame;
  }
}

// Config for neo_zero_char_01.png spritesheet
// Structure: 3 columns x 9 rows (32x32px frames)
// 3 character colors in 3x3 blocks
// Per character: row0=down(3frames), row1=up(3frames), row2=side(3frames)
// Using first character (red): rows 0-2
// left/right share row 2 (side), flip horizontally for left
export const DEFAULT_ANIM_CONFIG: AnimationConfig = {
  framesPerDirection: 3,
  frameDurationMs: 500, // 0.5초마다 프레임 전환
  idleRows: {
    down: 0,
    up: 1,
    left: 2,
    right: 2,
  },
  walkRows: {
    down: 0,
    up: 1,
    left: 2,
    right: 2,
  },
};
