const store = new Map<string, HTMLImageElement | null>();

export function registerAsset(key: string, src: string | undefined) {
  if (!src) {
    store.set(key, null);
    return;
  }
  const img = new Image();
  img.src = src;
  store.set(key, img);
}

export function getAsset(key: string): HTMLImageElement | null {
  const v = store.get(key);
  return v ?? null;
}

export function hasAsset(key: string): boolean {
  const v = store.get(key);
  return !!v && v.complete && v.naturalWidth > 0;
}
