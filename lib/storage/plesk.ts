import fs from "fs/promises"
import path from "path"

/**
 * Plesk Filesystem Storage Service
 * 
 * Handles OVPN file storage on Plesk server filesystem.
 * Files are stored in PLESK_UPLOAD_DIR and served through authenticated API only.
 */

const UPLOAD_DIR = process.env.PLESK_UPLOAD_DIR || "/var/www/vhosts/domain/uploads"
const OVPN_SUBDIR = "ovpn"

/**
 * Get the full path to a file
 */
function getFilePath(subPath: string): string {
  return path.join(UPLOAD_DIR, subPath)
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error: any) {
    if (error.code !== "EEXIST") throw error
  }
}

/**
 * Save an OVPN file to the Plesk filesystem
 * 
 * @param serverId - Server ID to organize files
 * @param fileName - Original filename
 * @param content - File content as Buffer or string
 * @returns Relative path to the saved file
 */
export async function saveOvpnFile(
  serverId: string,
  fileName: string,
  content: Buffer | string
): Promise<string> {
  const relativePath = path.join(OVPN_SUBDIR, serverId, fileName)
  const fullPath = getFilePath(relativePath)
  const dirPath = path.dirname(fullPath)

  await ensureDir(dirPath)
  
  const buffer = typeof content === "string" 
    ? Buffer.from(content, "base64") 
    : content

  await fs.writeFile(fullPath, buffer, { mode: 0o640 }) // rw-r----- permissions
  
  console.log(`[Storage] Saved OVPN file: ${relativePath}`)
  return relativePath
}

/**
 * Read an OVPN file from the Plesk filesystem
 * 
 * @param filePath - Relative path to the file
 * @returns File content as string
 */
export async function readOvpnFile(filePath: string): Promise<string> {
  const fullPath = getFilePath(filePath)
  
  try {
    const content = await fs.readFile(fullPath, "utf-8")
    return content
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(`OVPN file not found: ${filePath}`)
    }
    throw error
  }
}

/**
 * Delete an OVPN file from the Plesk filesystem
 * 
 * @param filePath - Relative path to the file
 */
export async function deleteOvpnFile(filePath: string): Promise<void> {
  const fullPath = getFilePath(filePath)
  
  try {
    await fs.unlink(fullPath)
    console.log(`[Storage] Deleted OVPN file: ${filePath}`)
    
    // Try to remove empty parent directory
    const dirPath = path.dirname(fullPath)
    try {
      await fs.rmdir(dirPath)
    } catch {
      // Directory not empty or other error - ignore
    }
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error
    }
    // File doesn't exist - that's fine for delete operation
  }
}

/**
 * Check if an OVPN file exists
 * 
 * @param filePath - Relative path to the file
 * @returns true if file exists
 */
export async function ovpnFileExists(filePath: string): Promise<boolean> {
  const fullPath = getFilePath(filePath)
  
  try {
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}

/**
 * Get file stats
 * 
 * @param filePath - Relative path to the file
 * @returns File stats or null if not found
 */
export async function getOvpnFileStats(filePath: string): Promise<{
  size: number
  createdAt: Date
  modifiedAt: Date
} | null> {
  const fullPath = getFilePath(filePath)
  
  try {
    const stats = await fs.stat(fullPath)
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    }
  } catch {
    return null
  }
}
