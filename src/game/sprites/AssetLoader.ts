// Asset loading with caching for images and spritesheets

export type LoadedImage = {
  image: HTMLImageElement;
  width: number;
  height: number;
};

class AssetLoader {
  private cache: Map<string, LoadedImage> = new Map();
  private loading: Map<string, Promise<LoadedImage>> = new Map();

  async load(path: string): Promise<LoadedImage> {
    // Return cached image if available
    const cached = this.cache.get(path);
    if (cached) return cached;

    // Return existing loading promise if in progress
    const existing = this.loading.get(path);
    if (existing) return existing;

    // Start new load
    const loadPromise = new Promise<LoadedImage>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const loaded: LoadedImage = {
          image: img,
          width: img.width,
          height: img.height,
        };
        this.cache.set(path, loaded);
        this.loading.delete(path);
        resolve(loaded);
      };
      img.onerror = () => {
        this.loading.delete(path);
        reject(new Error(`Failed to load image: ${path}`));
      };
      img.src = path;
    });

    this.loading.set(path, loadPromise);
    return loadPromise;
  }

  async loadAll(paths: string[]): Promise<Map<string, LoadedImage>> {
    const results = await Promise.allSettled(paths.map(p => this.load(p)));
    const loaded = new Map<string, LoadedImage>();

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        loaded.set(paths[i], result.value);
      }
    });

    return loaded;
  }

  get(path: string): LoadedImage | null {
    return this.cache.get(path) ?? null;
  }

  isLoaded(path: string): boolean {
    return this.cache.has(path);
  }
}

export const assetLoader = new AssetLoader();
