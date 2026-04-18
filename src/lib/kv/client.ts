type KVSetOpts = { ex?: number; nx?: boolean };

type KVClient = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, opts?: KVSetOpts): Promise<"OK" | null>;
  incr(key: string): Promise<number>;
};

let cachedClient: KVClient | null = null;
let cachedForLive: boolean | null = null;

async function buildClient(live: boolean): Promise<KVClient> {
  if (live) {
    const mod = await import("@vercel/kv");
    return mod.kv as unknown as KVClient;
  }
  const memory = new Map<string, { value: unknown; expireAt?: number }>();
  return {
    async get<T>(key: string): Promise<T | null> {
      const entry = memory.get(key);
      if (!entry) return null;
      if (entry.expireAt && entry.expireAt < Date.now()) {
        memory.delete(key);
        return null;
      }
      return entry.value as T;
    },
    async set<T>(key: string, value: T, opts?: KVSetOpts): Promise<"OK" | null> {
      if (opts?.nx && memory.has(key)) {
        const entry = memory.get(key)!;
        if (!entry.expireAt || entry.expireAt >= Date.now()) return null;
      }
      memory.set(key, {
        value,
        expireAt: opts?.ex ? Date.now() + opts.ex * 1000 : undefined,
      });
      return "OK";
    },
    async incr(key: string): Promise<number> {
      const entry = memory.get(key);
      const current = typeof entry?.value === "number" ? (entry.value as number) : 0;
      const next = current + 1;
      memory.set(key, { value: next, expireAt: entry?.expireAt });
      return next;
    },
  };
}

export function isKvLive(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export async function getKv(): Promise<KVClient> {
  const live = isKvLive();
  if (!cachedClient || cachedForLive !== live) {
    cachedClient = await buildClient(live);
    cachedForLive = live;
  }
  return cachedClient;
}
