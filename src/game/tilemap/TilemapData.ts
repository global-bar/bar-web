// Tilemap data types and loading

export type TilesetConfig = {
  imagePath: string;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  firstGid: number; // First tile ID (usually 1)
};

export type TileLayer = {
  name: string;
  data: number[]; // Tile IDs (0 = empty)
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
};

export type TilemapData = {
  width: number; // Map width in tiles
  height: number; // Map height in tiles
  tileWidth: number;
  tileHeight: number;
  tilesets: TilesetConfig[];
  layers: TileLayer[];
  collision?: number[]; // Collision data (0 = walkable, 1 = blocked)
};

// Get tile at grid position
export function getTileAt(layer: TileLayer, gridX: number, gridY: number): number {
  if (gridX < 0 || gridX >= layer.width || gridY < 0 || gridY >= layer.height) {
    return 0;
  }
  return layer.data[gridY * layer.width + gridX];
}

// Check if a layer should render below entities
export function isFloorLayer(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('floor') || lower.includes('wall') || lower.includes('base');
}

// Check if a layer should render above entities
export function isOverlayLayer(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('overlay') || lower.includes('top') || lower.includes('above');
}

// Check if a position is blocked (collision)
export function isBlocked(
  tilemap: TilemapData,
  pixelX: number,
  pixelY: number
): boolean {
  if (!tilemap.collision) return false;

  const gridX = Math.floor(pixelX / tilemap.tileWidth);
  const gridY = Math.floor(pixelY / tilemap.tileHeight);

  // Out of bounds is blocked
  if (gridX < 0 || gridX >= tilemap.width || gridY < 0 || gridY >= tilemap.height) {
    return true;
  }

  return tilemap.collision[gridY * tilemap.width + gridX] === 1;
}

// Check if movement to a new position would be blocked
export function canMoveTo(
  tilemap: TilemapData,
  toX: number,
  toY: number,
  entityWidth = 16,
  entityHeight = 16
): boolean {
  // Check center and corners of the entity's bounding box
  const halfW = entityWidth / 2;
  const halfH = entityHeight / 2;

  // Check multiple points around the entity for collision
  const points = [
    { x: toX, y: toY }, // center
    { x: toX - halfW + 2, y: toY - halfH + 2 }, // top-left (with small margin)
    { x: toX + halfW - 2, y: toY - halfH + 2 }, // top-right
    { x: toX - halfW + 2, y: toY + halfH - 2 }, // bottom-left
    { x: toX + halfW - 2, y: toY + halfH - 2 }, // bottom-right
  ];

  for (const pt of points) {
    if (isBlocked(tilemap, pt.x, pt.y)) {
      return false;
    }
  }

  return true;
}
