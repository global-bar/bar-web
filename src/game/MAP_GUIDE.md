# Map Tile 설정 가이드

이 문서는 bar-web 프로젝트에서 타일맵을 설정하고 커스텀 맵을 만드는 방법을 설명합니다.

## 목차

1. [타일맵 시스템 개요](#타일맵-시스템-개요)
2. [사용 가능한 타일셋](#사용-가능한-타일셋)
3. [타일 ID 계산 방법](#타일-id-계산-방법)
4. [코드로 맵 만들기](#코드로-맵-만들기)
5. [Tiled 에디터로 맵 만들기](#tiled-에디터로-맵-만들기)
6. [레이어 시스템](#레이어-시스템)
7. [주요 타일 ID 레퍼런스](#주요-타일-id-레퍼런스)

---

## 타일맵 시스템 개요

프로젝트는 16x16 픽셀 타일 기반의 2D 타일맵 시스템을 사용합니다.

### 관련 파일 구조

```
src/game/tilemap/
├── TilemapData.ts      # 타일맵 타입 정의
├── TilemapRenderer.ts  # 타일맵 렌더링 로직
├── TiledLoader.ts      # Tiled JSON 맵 로더
├── barMap.ts           # 현재 맵 데이터
└── maps/               # Tiled에서 export한 JSON 맵 저장 위치

public/sprites/tileset/
├── neo_zero_tiles_and_buildings_01.png  # 메인 타일셋 (바닥, 벽, 건물)
└── neo_zero_props_and_items_01.png      # 소품 타일셋 (자판기, 가구 등)
```

### 기본 타일맵 구조 (TilemapData)

```typescript
type TilemapData = {
  width: number;        // 맵 너비 (타일 개수)
  height: number;       // 맵 높이 (타일 개수)
  tileWidth: number;    // 타일 너비 (픽셀, 16)
  tileHeight: number;   // 타일 높이 (픽셀, 16)
  tilesets: TilesetConfig[];  // 사용할 타일셋들
  layers: TileLayer[];        // 레이어들
};
```

---

## 사용 가능한 타일셋

### 1. neo_zero_tiles_and_buildings_01.png

**용도**: 바닥, 벽, 건물 구조물

| 속성 | 값 |
|------|-----|
| 이미지 크기 | 320 x 320 픽셀 |
| 타일 크기 | 16 x 16 픽셀 |
| 열(columns) | 20 |
| 행(rows) | 20 |
| 총 타일 수 | 400 |
| firstGid | 1 |
| Tile ID 범위 | 1 ~ 400 |

**포함된 타일 종류**:
- 청록색 바닥 타일 (다양한 패턴)
- 어두운 벽 타일
- 지붕 타일 (계단형)
- 창문, 문
- 상점 전면 (빨간 네온, 유리창)
- 건물 내부 요소

### 2. neo_zero_props_and_items_01.png

**용도**: 소품, 장식, 인터랙티브 오브젝트

| 속성 | 값 |
|------|-----|
| 이미지 크기 | 160 x 160 픽셀 |
| 타일 크기 | 16 x 16 픽셀 |
| 열(columns) | 10 |
| 행(rows) | 10 |
| 총 타일 수 | 100 |
| firstGid | 401 |
| Tile ID 범위 | 401 ~ 500 |

**포함된 타일 종류**:
- 자판기 (음료, 스낵)
- ATM 기계
- 가로등, 신호등
- 의자, 테이블
- 쓰레기통
- 사이버펑크 장식품

---

## 타일 ID 계산 방법

타일 ID는 타일셋 이미지에서 타일의 위치를 기반으로 계산됩니다.

### 공식

```
Tile ID = (row * columns) + col + firstGid
```

- `row`: 행 번호 (0부터 시작, 위에서 아래로)
- `col`: 열 번호 (0부터 시작, 왼쪽에서 오른쪽으로)
- `columns`: 타일셋의 열 개수
- `firstGid`: 타일셋의 시작 ID

> **주의**: "위에서 3번째"는 row=2, "왼쪽에서 4번째"는 col=3입니다 (0부터 시작하기 때문)

### 예시: tiles_and_buildings 타일셋

```
타일셋 이미지 (20 columns):
+---+---+---+---+---+...
| 1 | 2 | 3 | 4 | 5 |...  <- row 0
+---+---+---+---+---+...
|21 |22 |23 |24 |25 |...  <- row 1
+---+---+---+---+---+...
|41 |42 |43 |44 |45 |...  <- row 2
```

**계산 예시**:
- (col=0, row=0) → 0 * 20 + 0 + 1 = **1**
- (col=4, row=8) → 8 * 20 + 4 + 1 = **165** (메인 바닥 타일)
- (col=19, row=19) → 19 * 20 + 19 + 1 = **400**

### 예시: props_and_items 타일셋

```
Tile ID = (row * 10) + col + 401
```

- (col=0, row=0) → 0 * 10 + 0 + 401 = **401**
- (col=5, row=2) → 2 * 10 + 5 + 401 = **426**

---

## 실전 예제: 타일 배치하기

### 예제 시나리오

**목표**: `neo_zero_props_and_items_01.png`에서 "위에서 3번째, 왼쪽에서 4번째" 타일을 맵의 좌표 (10, 5)에 배치하기

### Step 1: 타일 ID 계산

```
타일셋: props_and_items
- columns: 10
- firstGid: 401

위에서 3번째 = row 2 (0부터 시작)
왼쪽에서 4번째 = col 3 (0부터 시작)

Tile ID = (row * columns) + col + firstGid
        = (2 * 10) + 3 + 401
        = 20 + 3 + 401
        = 424
```

### Step 2: 맵 좌표를 배열 인덱스로 변환

맵 데이터는 1차원 배열로 저장됩니다. 좌표 (x, y)를 배열 인덱스로 변환하는 공식:

```
배열 인덱스 = (y * mapWidth) + x
```

예: 맵 너비가 60이고, 좌표 (10, 5)에 배치하려면:
```
인덱스 = (5 * 60) + 10 = 310
```

### Step 3: 코드로 구현

```typescript
// barMap.ts에서

// 1. 타일 ID 상수 정의
const T = {
  // props_and_items 타일셋 (firstGid: 401, columns: 10)
  // "위에서 3번째, 왼쪽에서 4번째" = row 2, col 3
  MY_PROP: 424,  // (2 * 10) + 3 + 401 = 424
};

// 2. 유틸리티 함수 (선택사항)
function getTileId(row: number, col: number, columns: number, firstGid: number): number {
  return (row * columns) + col + firstGid;
}

// props_and_items에서 타일 ID 계산
function getPropsId(row: number, col: number): number {
  return getTileId(row, col, 10, 401);
}

// 3. 특정 좌표에 타일 배치
function createPropsLayer(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = new Array(width * height).fill(0);

  // 방법 1: 직접 인덱스 계산
  const x = 10;
  const y = 5;
  data[y * width + x] = T.MY_PROP;

  // 방법 2: 유틸리티 함수 사용
  setTile(data, 10, 5, T.MY_PROP, width);

  // 방법 3: 동적으로 타일 ID 계산
  setTile(data, 15, 8, getPropsId(2, 3), width);

  return data;
}

// 타일 배치 헬퍼 함수
function setTile(data: number[], x: number, y: number, tileId: number, width: number) {
  if (x >= 0 && x < width && y >= 0 && y < data.length / width) {
    data[y * width + x] = tileId;
  }
}
```

### Step 4: 여러 타일 한번에 배치하기

```typescript
// 직사각형 영역 채우기
function fillRect(
  data: number[],
  startX: number,
  startY: number,
  rectWidth: number,
  rectHeight: number,
  tileId: number,
  mapWidth: number
) {
  for (let y = startY; y < startY + rectHeight; y++) {
    for (let x = startX; x < startX + rectWidth; x++) {
      data[y * mapWidth + x] = tileId;
    }
  }
}

// 사용 예시: (5, 10) 위치에서 3x2 크기로 타일 채우기
fillRect(propsData, 5, 10, 3, 2, T.MY_PROP, 60);
```

### 실전 예제: 바 인테리어 만들기

```typescript
const PROPS = {
  // props_and_items 타일셋에서 (row, col)
  VENDING_MACHINE: getPropsId(0, 0),  // 자판기 (row 0, col 0)
  ATM: getPropsId(0, 4),               // ATM (row 0, col 4)
  CHAIR: getPropsId(5, 0),             // 의자 (row 5, col 0)
  TABLE: getPropsId(5, 2),             // 테이블 (row 5, col 2)
  LAMP_POST: getPropsId(3, 5),         // 가로등 (row 3, col 5)
};

function createBarInterior(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = new Array(width * height).fill(0);

  // 입구 근처에 자판기 배치
  setTile(data, 5, 3, PROPS.VENDING_MACHINE, width);

  // ATM 배치
  setTile(data, 8, 3, PROPS.ATM, width);

  // 테이블과 의자 배치 (여러 세트)
  const tablePositions = [
    { x: 15, y: 10 },
    { x: 25, y: 10 },
    { x: 35, y: 10 },
  ];

  for (const pos of tablePositions) {
    setTile(data, pos.x, pos.y, PROPS.TABLE, width);
    setTile(data, pos.x - 1, pos.y, PROPS.CHAIR, width);  // 왼쪽 의자
    setTile(data, pos.x + 1, pos.y, PROPS.CHAIR, width);  // 오른쪽 의자
  }

  // 가로등 배치
  setTile(data, 2, 15, PROPS.LAMP_POST, width);
  setTile(data, 57, 15, PROPS.LAMP_POST, width);

  return data;
}
```

### props_and_items 타일셋 시각적 가이드

```
neo_zero_props_and_items_01.png (10 columns x 10 rows)

     col: 0   1   2   3   4   5   6   7   8   9
        +---+---+---+---+---+---+---+---+---+---+
row 0   |자판|   |   |   |ATM|   |박스|   |   |   |  ID: 401-410
        +---+---+---+---+---+---+---+---+---+---+
row 1   |   |   |음료|   |   |   |   |   |   |   |  ID: 411-420
        +---+---+---+---+---+---+---+---+---+---+
row 2   |   |   |   |[!]|   |   |   |   |   |   |  ID: 421-430
        +---+---+---+---+---+---+---+---+---+---+
row 3   |   |   |   |   |   |등 |   |   |   |   |  ID: 431-440
        +---+---+---+---+---+---+---+---+---+---+
        ...

[!] = "위에서 3번째(row 2), 왼쪽에서 4번째(col 3)" = ID 424
```

### 좌표 시스템 정리

| 개념 | 설명 | 예시 |
|-----|------|------|
| 타일셋 row/col | 타일셋 이미지에서의 위치 (0부터 시작) | "위에서 3번째" = row 2 |
| 맵 좌표 (x, y) | 게임 맵에서의 타일 위치 | (10, 5) = 왼쪽에서 11번째, 위에서 6번째 |
| 배열 인덱스 | 1차원 배열에서의 위치 | `y * mapWidth + x` |
| 픽셀 좌표 | 실제 화면 픽셀 위치 | `x * 16, y * 16` |

---

## 코드로 맵 만들기

### 기본 구조 (barMap.ts 참고)

```typescript
import type { TilemapData } from './TilemapData';

// 타일 ID 상수 정의
const T = {
  FLOOR_MAIN: 165,      // 메인 바닥
  FLOOR_ALT: 166,       // 대체 바닥
  WALL_TOP: 21,         // 벽 상단
  WALL_MID: 41,         // 벽 중앙
  // ... 더 추가
};

// 바닥 레이어 생성
function createFloorLayer(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 체크무늬 패턴 예시
      if ((x + y) % 2 === 0) {
        data.push(T.FLOOR_MAIN);
      } else {
        data.push(T.FLOOR_ALT);
      }
    }
  }

  return data;
}

// 벽 레이어 생성 (테두리)
function createWallsLayer(): number[] {
  const width = 60;
  const height = 34;
  const data: number[] = new Array(width * height).fill(0);

  for (let x = 0; x < width; x++) {
    // 상단 벽
    data[0 * width + x] = T.WALL_TOP;
    // 하단 벽
    data[(height - 1) * width + x] = T.WALL_MID;
  }

  return data;
}

export const MY_MAP: TilemapData = {
  width: 60,
  height: 34,
  tileWidth: 16,
  tileHeight: 16,

  tilesets: [
    {
      imagePath: '/sprites/tileset/neo_zero_tiles_and_buildings_01.png',
      tileWidth: 16,
      tileHeight: 16,
      columns: 20,
      firstGid: 1,
    },
    {
      imagePath: '/sprites/tileset/neo_zero_props_and_items_01.png',
      tileWidth: 16,
      tileHeight: 16,
      columns: 10,
      firstGid: 401,
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
  ],
};
```

### 특정 위치에 타일 배치하기

```typescript
function setTile(data: number[], x: number, y: number, tileId: number, width: number) {
  data[y * width + x] = tileId;
}

// 사용 예시
const propsData = new Array(60 * 34).fill(0);
setTile(propsData, 10, 5, 401, 60);  // (10, 5)에 자판기 배치
```

---

## Tiled 에디터로 맵 만들기

### 1. Tiled 설치

[Tiled Map Editor](https://www.mapeditor.org/)를 다운로드하여 설치합니다 (무료).

### 2. 새 맵 생성

1. **File > New Map**
2. 설정:
   - **Orientation**: Orthogonal
   - **Tile layer format**: CSV 또는 Base64
   - **Tile size**: 16 x 16 pixels
   - **Map size**: 원하는 크기 (예: 60 x 34 tiles)

### 3. 타일셋 추가

1. **Map > New Tileset**
2. 첫 번째 타일셋:
   - **Name**: `neo_zero_tiles_and_buildings_01`
   - **Source**: `public/sprites/tileset/neo_zero_tiles_and_buildings_01.png`
   - **Tile width/height**: 16 px
   - **Embed in map** 체크 권장

3. 두 번째 타일셋:
   - **Name**: `neo_zero_props_and_items_01`
   - **Source**: `public/sprites/tileset/neo_zero_props_and_items_01.png`
   - **Tile width/height**: 16 px

### 4. 레이어 구성

권장 레이어 구조 (아래에서 위 순서):

| 레이어 이름 | 용도 | 렌더링 순서 |
|------------|------|------------|
| `floor` | 바닥 타일 | 가장 아래 |
| `walls_base` | 벽, 구조물 | 바닥 위 |
| `props_base` | 소품, 가구 | 벽 위 |
| `overlay` | 캐릭터 위에 그려질 요소 | 가장 위 |

### 5. 맵 디자인 팁

- **Stamp Brush (B)**: 기본 타일 그리기
- **Bucket Fill (F)**: 영역 채우기
- **Terrain Brush**: 자동 타일 연결 (설정 필요)
- **Ctrl+C/V**: 영역 복사/붙여넣기

### 6. JSON으로 Export

1. **File > Export As**
2. 형식: **JSON map files (*.json)**
3. 저장 위치: `src/game/tilemap/maps/my-map.json`

### 7. 코드에서 사용

```typescript
// barMap.ts 수정
import { createTilemapFromTiled, type TiledMap } from './TiledLoader';
import myMapJson from './maps/my-map.json';

export const BAR_TILEMAP = createTilemapFromTiled(myMapJson as TiledMap);
```

---

## 레이어 시스템

### 레이어 렌더링 순서

레이어 이름에 따라 렌더링 순서가 결정됩니다:

1. **Floor 레이어** (캐릭터 아래)
   - 이름에 `floor`, `wall`, `base` 포함
   - 예: `floor`, `walls_base`, `props_base`

2. **캐릭터/엔티티**
   - 플레이어, NPC 등

3. **Overlay 레이어** (캐릭터 위)
   - 이름에 `overlay`, `top`, `above` 포함
   - 예: `roof_overlay`, `top_decorations`

### 레이어 판별 로직 (TilemapData.ts)

```typescript
// 캐릭터 아래에 그려지는 레이어
function isFloorLayer(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('floor') || lower.includes('wall') || lower.includes('base');
}

// 캐릭터 위에 그려지는 레이어
function isOverlayLayer(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('overlay') || lower.includes('top') || lower.includes('above');
}
```

---

## 주요 타일 ID 레퍼런스

### tiles_and_buildings (firstGid: 1)

아래는 자주 사용되는 타일의 대략적인 위치입니다. 정확한 ID는 타일셋 이미지를 참고하세요.

| 타일 종류 | 대략적 위치 | ID 범위 |
|----------|------------|---------|
| 청록색 바닥 (기본) | row 8-9 | 161-200 |
| 어두운 바닥 | row 0-2 | 1-60 |
| 지붕/계단 | row 3-6 | 61-140 |
| 상점 전면 | row 10-14 | 201-300 |
| 문/창문 | row 15-19 | 301-400 |

### props_and_items (firstGid: 401)

| 타일 종류 | 대략적 위치 | ID 범위 |
|----------|------------|---------|
| 자판기 | row 0-1 | 401-420 |
| ATM/기계 | row 1-2 | 411-430 |
| 가로등 | row 3-4 | 431-450 |
| 의자/테이블 | row 5-6 | 451-470 |
| 기타 소품 | row 7-9 | 471-500 |

---

## 빠른 시작 체크리스트

- [ ] Tiled 에디터 설치
- [ ] 새 맵 생성 (16x16 타일, Orthogonal)
- [ ] 타일셋 2개 추가 (tiles_and_buildings, props_and_items)
- [ ] floor 레이어 생성 및 바닥 타일 배치
- [ ] walls_base 레이어 생성 및 벽/구조물 배치
- [ ] props_base 레이어 생성 및 소품 배치
- [ ] JSON으로 export
- [ ] barMap.ts에서 import하여 사용

---

## 문제 해결

### 타일이 안 보여요
- 타일 ID가 0이면 빈 타일입니다
- firstGid 값이 올바른지 확인하세요
- 타일셋 이미지 경로가 `/sprites/tileset/...`으로 시작하는지 확인하세요

### 타일이 잘못된 위치에서 그려져요
- columns 값이 타일셋과 일치하는지 확인하세요
- tiles_and_buildings: 20 columns
- props_and_items: 10 columns

### Tiled에서 만든 맵이 로드 안 돼요
- JSON 형식으로 export했는지 확인하세요
- 타일셋 이름이 `DEFAULT_TILESET_MAPPINGS`에 정의되어 있는지 확인하세요
