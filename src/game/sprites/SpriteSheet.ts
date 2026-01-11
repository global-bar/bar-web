// Spritesheet frame management

import { assetLoader, type LoadedImage } from './AssetLoader';

export type SpriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SpriteSheetConfig = {
  imagePath: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
};

export class SpriteSheet {
  private image: LoadedImage | null = null;
  private config: SpriteSheetConfig;
  private loaded = false;

  constructor(config: SpriteSheetConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    try {
      this.image = await assetLoader.load(this.config.imagePath);
      this.loaded = true;
    } catch (e) {
      console.warn(`Failed to load spritesheet: ${this.config.imagePath}`);
      this.loaded = false;
    }
  }

  isReady(): boolean {
    return this.loaded && this.image !== null;
  }

  getFrame(index: number): SpriteFrame {
    const { frameWidth, frameHeight, columns } = this.config;
    const col = index % columns;
    const row = Math.floor(index / columns);

    return {
      x: col * frameWidth,
      y: row * frameHeight,
      w: frameWidth,
      h: frameHeight,
    };
  }

  getFrameByRowCol(row: number, col: number): SpriteFrame {
    const { frameWidth, frameHeight } = this.config;
    return {
      x: col * frameWidth,
      y: row * frameHeight,
      w: frameWidth,
      h: frameHeight,
    };
  }

  drawFrame(
    ctx: CanvasRenderingContext2D,
    frame: SpriteFrame,
    destX: number,
    destY: number,
    scale = 1
  ): void {
    if (!this.image) return;

    ctx.drawImage(
      this.image.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      destX,
      destY,
      frame.w * scale,
      frame.h * scale
    );
  }

  drawFrameIndex(
    ctx: CanvasRenderingContext2D,
    index: number,
    destX: number,
    destY: number,
    scale = 1
  ): void {
    this.drawFrame(ctx, this.getFrame(index), destX, destY, scale);
  }

  getConfig(): SpriteSheetConfig {
    return this.config;
  }
}
