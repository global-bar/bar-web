// Character sprite with animation support

import { SpriteSheet, type SpriteSheetConfig } from './SpriteSheet';
import {
  CharacterAnimator,
  DEFAULT_ANIM_CONFIG,
  type Direction,
  type AnimationConfig,
} from './Animation';

export type CharacterSpriteConfig = {
  spriteSheet: SpriteSheetConfig;
  animation?: AnimationConfig;
  scale?: number;
  // Offset from entity position to sprite draw position
  offsetX?: number;
  offsetY?: number;
};

export class CharacterSprite {
  private spriteSheet: SpriteSheet;
  private animator: CharacterAnimator;
  private scale: number;
  private offsetX: number;
  private offsetY: number;

  constructor(config: CharacterSpriteConfig) {
    this.spriteSheet = new SpriteSheet(config.spriteSheet);
    this.animator = new CharacterAnimator(config.animation ?? DEFAULT_ANIM_CONFIG);
    this.scale = config.scale ?? 1;
    this.offsetX = config.offsetX ?? 0;
    this.offsetY = config.offsetY ?? 0;
  }

  async load(): Promise<void> {
    await this.spriteSheet.load();
  }

  isReady(): boolean {
    return this.spriteSheet.isReady();
  }

  update(deltaMs: number, isMoving: boolean, direction: Direction): void {
    this.animator.update(deltaMs, isMoving, direction);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _isPlayer: boolean
  ): void {
    if (!this.isReady()) return;

    const row = this.animator.getRow();
    const col = this.animator.getColumn();
    const frame = this.spriteSheet.getFrameByRowCol(row, col);
    const direction = this.animator.getDirection();

    // Calculate draw position (center-bottom anchor)
    const drawX = x - (frame.w * this.scale) / 2 + this.offsetX;
    const drawY = y - frame.h * this.scale + this.offsetY;

    // Flip horizontally for left direction (side sprite faces right by default)
    if (direction === 'left') {
      ctx.save();
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      this.spriteSheet.drawFrame(
        ctx,
        frame,
        -drawX - frame.w * this.scale + x,
        drawY,
        this.scale
      );
      ctx.restore();
    } else {
      this.spriteSheet.drawFrame(ctx, frame, drawX, drawY, this.scale);
    }
  }

  getDirection(): Direction {
    return this.animator.getDirection();
  }

  getFrameSize(): { w: number; h: number } {
    const config = this.spriteSheet.getConfig();
    return {
      w: config.frameWidth * this.scale,
      h: config.frameHeight * this.scale,
    };
  }

  setFrame(frame: number): void {
    this.animator.setFrame(frame);
  }
}

// Config for neo_zero_char_01.png
// 3 columns x 9 rows, each frame is 32x32px
export const DEFAULT_CHARACTER_CONFIG: CharacterSpriteConfig = {
  spriteSheet: {
    imagePath: '/sprites/character/neo_zero_char_01.png',
    frameWidth: 32,
    frameHeight: 32,
    columns: 3,
    rows: 9,
  },
  scale: 1.5, // Scale up for better visibility
  offsetY: 0,
};
