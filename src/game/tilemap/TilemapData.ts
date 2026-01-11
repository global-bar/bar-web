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
