export class InMemoryCache<T> {
  private cache: Record<string, { value: T; expiry: number }> = {};

  /**
   * @param ttlMs The time-to-live for the cache in milliseconds
   */
  constructor(private readonly ttlMs: number) {}

  set(key: string, value: T) {
    this.cache[key] = {
      value,
      expiry: Date.now() + this.ttlMs,
    };
  }

  get(key: string): T | undefined {
    const cached = this.cache[key];

    if (!cached || cached.expiry < Date.now()) {
      return undefined;
    }

    return cached.value;
  }

  getOrSet<R extends T | Promise<T>>(key: string, value: T | (() => R)): R {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached as R;
    }

    const newValue = typeof value === "function" ? (value as () => R)() : value;

    if (!(newValue instanceof Promise)) {
      this.set(key, newValue as T);
      return newValue as R;
    }

    return newValue.then((resolvedValue) => {
      this.set(key, resolvedValue);
      return resolvedValue;
    }) as R;
  }
}
