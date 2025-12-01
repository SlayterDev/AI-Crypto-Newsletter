import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, "../../.cache");
const DEFAULT_TTL_MINUTES = 360; // 6 hours

/**
 * Ensures the cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch (error) {
      console.warn("Failed to create cache directory:", error.message);
    }
  }
}

/**
 * Generates a safe filename from a cache key
 */
function getCacheFilePath(key) {
  // Sanitize key to create a safe filename
  const sanitized = key.replace(/[^a-zA-Z0-9,-]/g, "_");
  return path.join(CACHE_DIR, `${sanitized}.json`);
}

/**
 * Retrieves cached data if it exists and is still fresh
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if expired/not found
 */
export function getCached(key) {
  const cacheEnabled = process.env.ENABLE_CACHE !== "false";

  if (!cacheEnabled) {
    return null;
  }

  try {
    const filePath = getCacheFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const cached = JSON.parse(fileContent);

    const now = Date.now();
    const expiresAt = cached.timestamp + cached.ttl;

    if (now > expiresAt) {
      // Cache expired
      console.log(`Cache expired for key: ${key}`);
      fs.unlinkSync(filePath); // Clean up expired cache
      return null;
    }

    console.log(`Cache hit for key: ${key}`);
    return cached.data;
  } catch (error) {
    console.warn(`Cache read error for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Stores data in cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlMinutes - Time to live in minutes (optional)
 */
export function setCached(key, data, ttlMinutes = null) {
  const cacheEnabled = process.env.ENABLE_CACHE !== "false";

  if (!cacheEnabled) {
    return;
  }

  try {
    ensureCacheDir();

    const ttl = (ttlMinutes || parseInt(process.env.CACHE_TTL_MINUTES || DEFAULT_TTL_MINUTES, 10)) * 60 * 1000;

    const cacheEntry = {
      timestamp: Date.now(),
      ttl,
      data,
    };

    const filePath = getCacheFilePath(key);
    fs.writeFileSync(filePath, JSON.stringify(cacheEntry, null, 2), "utf8");

    console.log(`Cache set for key: ${key} (TTL: ${ttl / 60000} minutes)`);
  } catch (error) {
    console.warn(`Cache write error for key ${key}:`, error.message);
  }
}

/**
 * Clears all cached files
 * @returns {number} Number of files deleted
 */
export function clearCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      console.log("Cache directory does not exist");
      return 0;
    }

    const files = fs.readdirSync(CACHE_DIR);
    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(CACHE_DIR, file);
      if (fs.statSync(filePath).isFile() && file.endsWith(".json")) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    console.log(`Cleared ${deletedCount} cache files`);
    return deletedCount;
  } catch (error) {
    console.warn("Cache clear error:", error.message);
    return 0;
  }
}
