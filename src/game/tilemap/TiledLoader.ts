// Tiled JSON map loader
// Supports maps exported from Tiled (https://www.mapeditor.org/)

import type { TilemapData, TileLayer, TilesetConfig } from './TilemapData';

// Tiled JSON format types
export type TiledTileset = {
  firstgid: number;
  source?: string; // External tileset reference
  // Embedded tileset properties
  name?: string;
  image?: string;
  imagewidth?: number;
  imageheight?: number;
  tilewidth?: number;
  tileheight?: number;
  columns?: number;
  tilecount?: number;
};

export type TiledLayer = {
  name: string;
  type: 'tilelayer' | 'objectgroup' | 'imagelayer' | 'group';
  data?: number[]; // For tile layers
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  x?: number;
  y?: number;
};

export type TiledMap = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  tilesets: TiledTileset[];
  layers: TiledLayer[];
  orientation?: string;
  renderorder?: string;
};

// Mapping from Tiled tileset name to local asset path
export type TilesetPathMapping = {
  [tiledName: string]: string;
};

// Default tileset mappings for this project
export const DEFAULT_TILESET_MAPPINGS: TilesetPathMapping = {
  neo_zero_tiles_and_buildings_01: '/sprites/tileset/neo_zero_tiles_and_buildings_01.png',
  'neo_zero_tiles_and_buildings_01.png': '/sprites/tileset/neo_zero_tiles_and_buildings_01.png',
  neo_zero_props_and_items_01: '/sprites/tileset/neo_zero_props_and_items_01.png',
  'neo_zero_props_and_items_01.png': '/sprites/tileset/neo_zero_props_and_items_01.png',
};

/**
 * Convert a Tiled JSON map to our TilemapData format
 */
export function parseTiledMap(
  tiledJson: TiledMap,
  tilesetMappings: TilesetPathMapping = DEFAULT_TILESET_MAPPINGS
): TilemapData {
  const tilesets: TilesetConfig[] = tiledJson.tilesets.map(ts => {
    // Get image path - try mapping first, then use embedded path
    let imagePath = '';
    if (ts.name && tilesetMappings[ts.name]) {
      imagePath = tilesetMappings[ts.name];
    } else if (ts.image) {
      // Try to find by image filename
      const filename = ts.image.split('/').pop() || '';
      imagePath = tilesetMappings[filename] || ts.image;
    }

    return {
      imagePath,
      tileWidth: ts.tilewidth || tiledJson.tilewidth,
      tileHeight: ts.tileheight || tiledJson.tileheight,
      columns: ts.columns || 1,
      firstGid: ts.firstgid,
    };
  });

  const layers: TileLayer[] = tiledJson.layers
    .filter(layer => layer.type === 'tilelayer' && layer.data)
    .map(layer => ({
      name: layer.name,
      width: layer.width,
      height: layer.height,
      visible: layer.visible,
      opacity: layer.opacity,
      data: layer.data as number[],
    }));

  return {
    width: tiledJson.width,
    height: tiledJson.height,
    tileWidth: tiledJson.tilewidth,
    tileHeight: tiledJson.tileheight,
    tilesets,
    layers,
  };
}

/**
 * Load a Tiled JSON map from a URL
 */
export async function loadTiledMap(
  url: string,
  tilesetMappings?: TilesetPathMapping
): Promise<TilemapData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load map: ${response.statusText}`);
  }
  const tiledJson: TiledMap = await response.json();
  return parseTiledMap(tiledJson, tilesetMappings);
}

/**
 * Create TilemapData directly from a Tiled JSON object
 */
export function createTilemapFromTiled(
  tiledJson: TiledMap,
  tilesetMappings?: TilesetPathMapping
): TilemapData {
  return parseTiledMap(tiledJson, tilesetMappings);
}
