import { PrismaClient } from "@prisma/client"

declare global {
  // Allow global `var` declarations for Prisma client singleton
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var _prismaPromise: Promise<PrismaClient> | undefined
}

/**
 * Get Prisma client with lazy initialization
 * This defers database connection until first use (runtime), not at build time
 */
async function getPrismaClient(): Promise<PrismaClient> {
  if (globalThis._prisma) {
    return globalThis._prisma
  }

  // Dynamically import to avoid build-time initialization
  const { Pool } = await import("pg")
  const { PrismaPg } = await import("@prisma/adapter-pg")

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

  if (process.env.NODE_ENV !== "production") {
    globalThis._prisma = client
  }

  return client
}

/**
 * Lazy Prisma client getter - use this in API routes
 * Example: const prisma = await getPrisma()
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (!globalThis._prismaPromise) {
    globalThis._prismaPromise = getPrismaClient()
  }
  return globalThis._prismaPromise
}

// For synchronous imports during module load (with safeguard)
// This will be undefined during build but available at runtime
let _prismaSync: PrismaClient | null = null

// Proxy that lazily initializes Prisma on first property access
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prismaSync && process.env.DATABASE_URL) {
      // Synchronous fallback - will work after first await getPrisma()
      // or if globalThis._prisma is set
      if (globalThis._prisma) {
        _prismaSync = globalThis._prisma
      } else {
        // Force initialization - this is blocking but only happens once
        const { Pool } = require("pg")
        const { PrismaPg } = require("@prisma/adapter-pg")
        const pool = new Pool({ connectionString: process.env.DATABASE_URL })
        const adapter = new PrismaPg(pool)
        _prismaSync = new PrismaClient({
          adapter,
          log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        })
        globalThis._prisma = _prismaSync
      }
    }

    if (!_prismaSync) {
      // During build time / static generation, return a stub
      if (typeof prop === "string" && ["$connect", "$disconnect", "$on", "$use"].includes(prop)) {
        return async () => {}
      }
      // For model access, return a proxy that throws at runtime
      return new Proxy({}, {
        get() {
          throw new Error("DATABASE_URL not set - cannot access database")
        }
      })
    }

    return (_prismaSync as any)[prop]
  }
})

export default prisma
