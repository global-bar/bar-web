// Cyberpunk bar tilemap data using neo_zero tileset
// Map: 60 tiles wide x 34 tiles high (960x544 at 16px tiles)

import type { TilemapData } from './TilemapData';

// Tile IDs for neo_zero_tiles_and_buildings_01.png
// The tileset is arranged with various floor, wall, and building tiles
// We'll use simple IDs based on visual inspection

// Tileset 1: tiles_and_buildings (20 cols x 20 rows, 16x16 tiles)
// Tile ID = row * 20 + col + firstGid
// col과 row는 0부터 시작 (0-indexed)
const T = {
  // 5번째 열(col=4), 9번째 행(row=8) = 8*20 + 4 + 1 = 165
  FLOOR_MAIN: 165,
};

// Create a simple bar floor pattern (60x34 tiles)
function createFloorLayer(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.push(T.FLOOR_MAIN);
    }
  }

  return data;
}

// Empty layers for now - will add walls/props after testing floor
function createWallsLayer(): number[] {
  const width = 60;
  const height = 34;
  return new Array(width * height).fill(0);
}

function createPropsLayer(): number[] {
  const width = 60;
  const height = 34;
  return new Array(width * height).fill(0);
}

export const BAR_TILEMAP: TilemapData = {
  width: 60,
  height: 34,
  tileWidth: 16,
  tileHeight: 16,

  tilesets: [
    {
      imagePath: '/sprites/tileset/neo_zero_tiles_and_buildings_01.png',
      tileWidth: 16,
      tileHeight: 16,
      columns: 20, // 320px / 16px = 20 columns
      firstGid: 1,
    },
    {
      imagePath: '/sprites/tileset/neo_zero_props_and_items_01.png',
      tileWidth: 16,
      tileHeight: 16,
      columns: 10, // 160px / 16px = 10 columns
      firstGid: 401, // 20 cols x 20 rows = 400 tiles in first tileset
    },
  ],

  layers: [
    {
      name: 'floor',
      width: 60,
      height: 34,
      visible: true,
      opacity: 1,
      data: createFloorLayer(),
    },
    {
      name: 'walls_base',
      width: 60,
      height: 34,
      visible: true,
      opacity: 1,
      data: createWallsLayer(),
    },
    {
      name: 'props_base',
      width: 60,
      height: 34,
      visible: true,
      opacity: 1,
      data: createPropsLayer(),
    },
  ],
};
