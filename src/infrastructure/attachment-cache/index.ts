export interface CachedAttachment {
  name: string;
  url: string;
  proxyURL: string;
  contentType: string | null;
  size: number;
}

interface CacheEntry {
  attachments: CachedAttachment[];
  authorTag: string;
  timestamp: number;
}

const MAX_CACHE_SIZE = 5000;
const TTL_MS = 30 * 60 * 1000; // 30 минут

class AttachmentCache {
  private cache = new Map<string, CacheEntry>();

  set(messageId: string, entry: CacheEntry): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictOldest();
    }
    this.cache.set(messageId, entry);
  }

  get(messageId: string): CacheEntry | undefined {
    const entry = this.cache.get(messageId);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > TTL_MS) {
      this.cache.delete(messageId);
      return undefined;
    }
    return entry;
  }

  delete(messageId: string): void {
    this.cache.delete(messageId);
  }

  get size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    const now = Date.now();
    for (const [id, entry] of this.cache) {
      if (now - entry.timestamp > TTL_MS) {
        this.cache.delete(id);
      }
    }
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }
}

export const attachmentCache = new AttachmentCache();
