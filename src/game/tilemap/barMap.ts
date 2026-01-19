// Cyberpunk bar tilemap data using neo_zero tileset
// Map: 60 tiles wide x 34 tiles high (960x544 at 16px tiles)
//
// To use a Tiled map instead, import your JSON:
// import { createTilemapFromTiled, type TiledMap } from './TiledLoader';
// import myMapJson from './maps/my-map.json';
// export const BAR_TILEMAP = createTilemapFromTiled(myMapJson as TiledMap);

import type { TilemapData } from './TilemapData';

// =============================================================================
// 타일 ID 계산 방법
// =============================================================================
// Tile ID = (row * columns) + col + firstGid
//
// - row: 위에서부터 0, 1, 2... (위에서 N번째 = row N-1)
// - col: 왼쪽에서부터 0, 1, 2... (왼쪽에서 N번째 = col N-1)
// - "아래에서 N번째"는 row = (총 행 수 - N)
//
// 타일셋 정보:
// - tileset_02: 304x208px → 19열(columns) x 13행(rows), firstGid=501
// =============================================================================

const T = {
  // neo_zero_tileset_02.png에서 (columns: 19, firstGid: 501)
  // 바닥: row 10, col 0 → (10 * 19) + 0 + 501 = 691
  FLOOR_MAIN: 691,
  // 벽 상단: row 8, col 1 → (8 * 19) + 1 + 501 = 654
  WALL_TOP: 654,
  // 벽 하단: row 9, col 1 → (9 * 19) + 1 + 501 = 673
  WALL_BOTTOM: 673,

  // neo_zero_props_02_free.png에서 (columns: 11, firstGid: 748)
  // 자판기 (1x2 크기): col 6, row 0-1
  VENDING_TOP: 766,    // row 0, col 6 → (0 * 11) + 6 + 748 = 754
  VENDING_BOTTOM: 777, // row 1, col 6 → (1 * 11) + 6 + 748 = 765
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

// 벽 레이어: y=0,1에 WALL_TOP, y=2에 WALL_BOTTOM
function createWallsLayer(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = new Array(width * height).fill(0);

  for (let x = 0; x < width; x++) {
    // 맵의 맨 윗줄 (y = 0)
    data[0 * width + x] = T.WALL_TOP;
    // 맵의 두번째 줄 (y = 1)
    data[1 * width + x] = T.WALL_TOP;
    // 맵의 세번째 줄 (y = 2)
    data[2 * width + x] = T.WALL_BOTTOM;
  }

  return data;
}

// 자판기 위치 (나중에 수정하기 쉽게 상수로 분리)
const VENDING_MACHINE_POS = { x: 10, y: 10 }; // 자판기 하단 위치

function createPropsLayer(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = new Array(width * height).fill(0);

  // 자판기 배치 (1x2 크기: 상단 + 하단)
  const vx = VENDING_MACHINE_POS.x;
  const vy = VENDING_MACHINE_POS.y;
  data[(vy - 1) * width + vx] = T.VENDING_TOP;    // 상단
  data[vy * width + vx] = T.VENDING_BOTTOM;       // 하단

  return data;
}

// 충돌 데이터 생성: 0 = 이동 가능, 1 = 이동 불가 (장애물)
function createCollisionData(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = new Array(width * height).fill(0);

  // 벽 영역 (y = 0, 1, 2)은 이동 불가
  for (let x = 0; x < width; x++) {
    data[0 * width + x] = 1; // 맨 윗줄
    data[1 * width + x] = 1; // 두번째 줄
    data[2 * width + x] = 1; // 세번째 줄
  }

  // 자판기 충돌 (1x2 크기)
  const vx = VENDING_MACHINE_POS.x;
  const vy = VENDING_MACHINE_POS.y;
  data[(vy - 1) * width + vx] = 1; // 상단
  data[vy * width + vx] = 1;       // 하단

  return data;
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
    {
      imagePath: '/sprites/tileset/neo_zero_tileset_02.png',
      tileWidth: 16,
      tileHeight: 16,
      columns: 19, // 304px / 16px = 19 columns
      firstGid: 501, // 400 + 100 = 500, 다음은 501부터
    },
    {
      imagePath: '/sprites/tileset/neo_zero_props_02_free.png',
      tileWidth: 16,
      tileHeight: 16,
      columns: 11, // 176px / 16px = 11 columns
      firstGid: 748, // 501 + (19 * 13) = 501 + 247 = 748
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

  // 충돌 데이터
  collision: createCollisionData(),
};
