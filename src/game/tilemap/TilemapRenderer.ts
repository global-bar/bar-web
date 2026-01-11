// Tilemap rendering with layered support

import { assetLoader, type LoadedImage } from '../sprites/AssetLoader';
import {
  type TilemapData,
  type TileLayer,
  isFloorLayer,
  isOverlayLayer,
} from './TilemapData';

export class TilemapRenderer {
  private tilemap: TilemapData;
  private tilesetImages: Map<string, LoadedImage> = new Map();
  private floorCache: HTMLCanvasElement | null = null;
  private loaded = false;

  constructor(tilemap: TilemapData) {
    this.tilemap = tilemap;
  }

  async loadAssets(): Promise<void> {
    try {
      const paths = this.tilemap.tilesets.map(t => t.imagePath);
      const images = await assetLoader.loadAll(paths);

      for (const tileset of this.tilemap.tilesets) {
        const img = images.get(tileset.imagePath);
        if (img) {
          this.tilesetImages.set(tileset.imagePath, img);
        }
      }

      this.loaded = this.tilesetImages.size > 0;
    } catch (e) {
      console.warn('Failed to load tilemap assets:', e);
      this.loaded = false;
    }
  }

  isReady(): boolean {
    return this.loaded;
  }

  // Pre-render floor layers to offscreen canvas for performance
  buildFloorCache(): void {
    if (!this.loaded) return;

    const { width, height, tileWidth, tileHeight } = this.tilemap;
    const canvas = document.createElement('canvas');
    canvas.width = width * tileWidth;
    canvas.height = height * tileHeight;
    const ctx = canvas.getContext('2d')!;

    // Draw all floor layers
    for (const layer of this.tilemap.layers) {
      if (!layer.visible || !isFloorLayer(layer.name)) continue;
      this.drawLayer(ctx, layer);
    }

    this.floorCache = canvas;
  }

  // Draw a single layer
  private drawLayer(ctx: CanvasRenderingContext2D, layer: TileLayer): void {
    const { tileWidth, tileHeight } = this.tilemap;

    for (let y = 0; y < layer.height; y++) {
      for (let x = 0; x < layer.width; x++) {
        const tileId = layer.data[y * layer.width + x];
        if (tileId === 0) continue;

        // Find tileset for this tile ID
        const tileset = this.findTileset(tileId);
        if (!tileset) continue;

        const image = this.tilesetImages.get(tileset.imagePath);
        if (!image) continue;

        // Calculate source position in tileset
        const localId = tileId - tileset.firstGid;
        const srcX = (localId % tileset.columns) * tileset.tileWidth;
        const srcY = Math.floor(localId / tileset.columns) * tileset.tileHeight;

        // Draw tile
        ctx.drawImage(
          image.image,
          srcX,
          srcY,
          tileset.tileWidth,
          tileset.tileHeight,
          x * tileWidth,
          y * tileHeight,
          tileWidth,
          tileHeight
        );
      }
    }
  }

  private findTileset(tileId: number) {
    // Find the tileset that contains this tile ID
    // Assumes tilesets are sorted by firstGid ascending
    let result = this.tilemap.tilesets[0];
    for (const tileset of this.tilemap.tilesets) {
      if (tileset.firstGid <= tileId) {
        result = tileset;
      } else {
        break;
      }
    }
    return result;
  }

  // Draw floor layers (below entities)
  drawFloorLayers(ctx: CanvasRenderingContext2D): void {
    if (this.floorCache) {
      ctx.drawImage(this.floorCache, 0, 0);
      return;
    }

    // Fallback: draw directly
    for (const layer of this.tilemap.layers) {
      if (!layer.visible || !isFloorLayer(layer.name)) continue;
      ctx.globalAlpha = layer.opacity;
      this.drawLayer(ctx, layer);
    }
    ctx.globalAlpha = 1;
  }

  // Draw overlay layers (above entities)
  drawOverlayLayers(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.tilemap.layers) {
      if (!layer.visible || !isOverlayLayer(layer.name)) continue;
      ctx.globalAlpha = layer.opacity;
      this.drawLayer(ctx, layer);
    }
    ctx.globalAlpha = 1;
  }

  getTilemap(): TilemapData {
    return this.tilemap;
  }
}
