import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { authenticateToken } from '../middleware/auth';

// Try to import sharp dynamically, but make it optional
interface SharpInstance {
  (buffer: Buffer): SharpInstance;
  webp(options: { quality: number }): SharpInstance;
  resize(width: number, height: number, options?: any): SharpInstance;
  toBuffer(): Promise<Buffer>;
}

let sharp: ((buffer: Buffer) => SharpInstance) | null = null;
try {
  sharp = require('sharp') as (buffer: Buffer) => SharpInstance;
} catch (e) {
  console.warn('[Upload] Sharp not installed - server-side compression disabled');
}

const router = Router();
const baseUploadDir = env.uploadDir || path.join(process.cwd(), 'uploads');
const uploadDir = path.join(baseUploadDir, 'images');
const ALLOWED_FOLDERS = new Set(['carousel', 'branding', 'gallery']);

// Ensure upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

// Helpers
const sanitizeFolder = (value: unknown): string | null => {
  const folder = typeof value === 'string' ? value.trim() : '';
  return ALLOWED_FOLDERS.has(folder) ? folder : null;
};

const buildPath = (folder: string | null, tenantId: string, filename: string) => {
  const parts = folder ? [uploadDir, folder, tenantId] : [uploadDir, tenantId];
  return { dir: path.join(...parts), url: `/${parts.join('/')}/${filename}`.replace(process.cwd().replace(/\\/g, '/'), '') };
};

const getImageUrl = (folder: string | null, tenantId: string, filename: string) =>
  folder ? `/uploads/images/${folder}/${tenantId}/${filename}` : `/uploads/images/${tenantId}/${filename}`;

/**
 * Compress product images to under 15KB using Sharp
 * If Sharp is not available or image is already small, returns original buffer
 */
const compressProductImage = async (buffer: Buffer, originalName: string): Promise<Buffer> => {
  const targetSizeKB = 15;
  const targetSizeBytes = targetSizeKB * 1024;
  
  // If sharp is not available, return original
  if (!sharp) {
    console.log('[Upload] Sharp not available, skipping server-side compression');
    return buffer;
  }
  
  try {
    // Skip compression for carousel images or if already small enough
    if (buffer.length <= targetSizeBytes) {
      console.log(`[Upload] Image already under ${targetSizeKB}KB: ${(buffer.length / 1024).toFixed(1)}KB`);
      return buffer;
    }
    
    // Start with quality 80 and compress to WebP
    let quality = 80;
    let compressed = await sharp(buffer)
      .webp({ quality })
      .toBuffer();
    
    // If still too large, reduce quality iteratively
    let attempts = 0;
    while (compressed.length > targetSizeBytes && quality > 20 && attempts < 8) {
      quality -= 10;
      compressed = await sharp(buffer)
        .webp({ quality })
        .toBuffer();
      attempts++;
    }
    
    // If still too large, resize down maintaining square aspect ratio
    if (compressed.length > targetSizeBytes) {
      let size = 800; // Start with 800x800
      while (compressed.length > targetSizeBytes && size > 400) {
        size -= 100;
        compressed = await sharp(buffer)
          .resize(size, size, { 
            fit: 'cover',  // Maintain square crop
            position: 'center' 
          })
          .webp({ quality: 60 })
          .toBuffer();
      }
    }
    
    const originalSize = (buffer.length / 1024).toFixed(1);
    const compressedSize = (compressed.length / 1024).toFixed(1);
    console.log(`[Upload] Compressed: ${originalSize}KB → ${compressedSize}KB`);
    
    return compressed;
  } catch (error) {
    console.error('[Upload] Compression failed:', error);
    return buffer; // Fallback to original
  }
};

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Error handler
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 5MB.' : err.message || 'Upload failed';
    return res.status(400).json({ success: false, error: msg });
  }
  next();
};

// POST /api/upload - Upload image
router.post('/api/upload', authenticateToken, upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    // Validate tenantId - must be provided and non-empty
    const tenantId = req.body.tenantId;
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }
    
    const folder = sanitizeFolder(req.body.folder);
    const tenantDir = folder ? path.join(uploadDir, folder, tenantId) : path.join(uploadDir, tenantId);
    
    fs.mkdirSync(tenantDir, { recursive: true });
    
    // Compress product images (skip carousel images)
    let fileBuffer = req.file.buffer;
    let fileExtension = path.extname(req.file.originalname) || '.jpg';
    
    const skipCompression = folder === 'carousel' || folder === 'branding';
    if (!skipCompression) {
      // Compress product images only (skip carousel & branding)
      fileBuffer = await compressProductImage(req.file.buffer, req.file.originalname);
      fileExtension = '.webp';
    }
    
    const filename = `${uuidv4()}${fileExtension}`;
    fs.writeFileSync(path.join(tenantDir, filename), fileBuffer);
    
    const imageUrl = getImageUrl(folder, tenantId, filename);
    console.log(`[upload] Image saved: ${imageUrl} (${(fileBuffer.length / 1024).toFixed(1)}KB)`);
    
    res.json({ success: true, imageUrl, imageId: filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Upload failed' });
  }
});

// Helper to validate resolved file path stays within upload directory
const isPathSafe = (filePath: string, baseDir: string): boolean => {
  const normalized = path.resolve(filePath);
  const normalizedBase = path.resolve(baseDir);
  return normalized.startsWith(normalizedBase + path.sep) || normalized === normalizedBase;
};

// Helper to validate filename has no path traversal
const isSafeFilename = (filename: string): boolean => {
  if (!filename) return false;
  return !filename.includes('/') && !filename.includes('\\') && !filename.includes('..');
};

// DELETE /api/upload - Delete image
router.delete('/api/upload', authenticateToken, (req: Request, res: Response) => {
  try {
    const { imageUrl, tenantId } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, error: 'Image URL is required' });
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }

    const relative = String(imageUrl).replace(/^https?:\/\/[^/]+/i, '').trim();
    if (!relative.startsWith('/uploads/images/')) return res.status(400).json({ success: false, error: 'Invalid image URL' });

    const parts = relative.split('/').filter(Boolean);
    const hasFolder = ALLOWED_FOLDERS.has(parts[2]);
    const [resolvedTenantId, filename] = hasFolder ? [parts[3], parts[4]] : [parts[2], parts[3]];

    if (!resolvedTenantId || !filename) return res.status(400).json({ success: false, error: 'Invalid image URL' });
    if (resolvedTenantId !== tenantId) return res.status(403).json({ success: false, error: 'Tenant mismatch' });
    if (!isSafeFilename(filename)) return res.status(400).json({ success: false, error: 'Invalid filename' });

    const filePath = hasFolder
      ? path.join(uploadDir, parts[2], resolvedTenantId, filename)
      : path.join(uploadDir, resolvedTenantId, filename);

    // Prevent path traversal - ensure resolved path stays within upload directory
    if (!isPathSafe(filePath, uploadDir)) {
      return res.status(400).json({ success: false, error: 'Invalid path' });
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Delete failed' });
  }
});

// POST /api/upload/fix-base64 - Convert base64 to file
router.post('/api/upload/fix-base64', authenticateToken, express.json({ limit: '50mb' }), (req: Request, res: Response) => {
  try {
    const { base64Data, tenantId, folder, filename } = req.body;
    if (!base64Data || !tenantId) return res.status(400).json({ success: false, error: 'base64Data and tenantId are required' });

    const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ success: false, error: 'Invalid base64 image format' });

    const validatedFolder = sanitizeFolder(folder);
    const tenantDir = validatedFolder ? path.join(uploadDir, validatedFolder, tenantId) : path.join(uploadDir, tenantId);
    fs.mkdirSync(tenantDir, { recursive: true });

    const extMap: Record<string, string> = { webp: '.webp', png: '.png' };
    const ext = extMap[match[1] as string] || '.jpg';
    // Validate filename to prevent path traversal
    const rawFilename = filename || `${uuidv4()}${ext}`;
    if (!isSafeFilename(rawFilename)) {
      return res.status(400).json({ success: false, error: 'Invalid filename' });
    }
    const finalFilename = rawFilename;
    const targetPath = path.join(tenantDir, finalFilename);
    if (!isPathSafe(targetPath, uploadDir)) {
      return res.status(400).json({ success: false, error: 'Invalid path' });
    }
    fs.writeFileSync(targetPath, Buffer.from(match[2], 'base64'));

    const imageUrl = getImageUrl(validatedFolder, tenantId, finalFilename);
    console.log(`[upload] Base64 converted: ${imageUrl}`);
    
    res.json({ success: true, imageUrl, imageId: finalFilename });
  } catch (error) {
    console.error('Base64 conversion error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Conversion failed' });
  }
});

// ============================================================================
// TRASH SYSTEM - Move to trash with 24hr retention
// ============================================================================

const trashDir = path.join(baseUploadDir, 'trash');
fs.mkdirSync(trashDir, { recursive: true });

// Trash metadata file
const trashMetaFile = path.join(trashDir, 'trash-meta.json');

interface TrashItem {
  originalUrl: string;
  trashPath: string;
  deletedAt: number;
  tenantId: string;
  folder: string | null;
  filename: string;
}

const loadTrashMeta = (): TrashItem[] => {
  try {
    if (fs.existsSync(trashMetaFile)) {
      return JSON.parse(fs.readFileSync(trashMetaFile, 'utf-8'));
    }
  } catch (e) {
    console.error('[Trash] Failed to load metadata:', e);
  }
  return [];
};

const saveTrashMeta = (items: TrashItem[]) => {
  fs.writeFileSync(trashMetaFile, JSON.stringify(items, null, 2));
};

// POST /api/upload/trash - Move image to trash
router.post('/api/upload/trash', authenticateToken, express.json(), (req: Request, res: Response) => {
  try {
    const { imageUrl, tenantId } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, error: 'Image URL is required' });
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }

    const relative = String(imageUrl).replace(/^https?:\/\/[^/]+/i, '').trim();
    if (!relative.startsWith('/uploads/images/')) {
      return res.status(400).json({ success: false, error: 'Invalid image URL' });
    }

    const parts = relative.split('/').filter(Boolean);
    const hasFolder = ALLOWED_FOLDERS.has(parts[2]);
    const folder = hasFolder ? parts[2] : null;
    const [resolvedTenantId, filename] = hasFolder ? [parts[3], parts[4]] : [parts[2], parts[3]];

    if (!resolvedTenantId || !filename) {
      return res.status(400).json({ success: false, error: 'Invalid image URL' });
    }
    if (resolvedTenantId !== tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant mismatch' });
    }

    const filePath = hasFolder
      ? path.join(uploadDir, parts[2], resolvedTenantId, filename)
      : path.join(uploadDir, resolvedTenantId, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    // Create tenant trash folder
    const tenantTrashDir = path.join(trashDir, tenantId);
    fs.mkdirSync(tenantTrashDir, { recursive: true });

    // Move to trash
    const trashFilename = `${Date.now()}_${filename}`;
    const trashPath = path.join(tenantTrashDir, trashFilename);
    fs.renameSync(filePath, trashPath);

    // Save metadata
    const trashItems = loadTrashMeta();
    trashItems.push({
      originalUrl: imageUrl,
      trashPath: `/uploads/trash/${tenantId}/${trashFilename}`,
      deletedAt: Date.now(),
      tenantId,
      folder,
      filename
    });
    saveTrashMeta(trashItems);

    console.log(`[Trash] Moved to trash: ${imageUrl}`);
    res.json({ success: true, message: 'Image moved to trash' });
  } catch (error) {
    console.error('Trash error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Trash failed' });
  }
});

// GET /api/upload/trash - List trash items for tenant
router.get('/api/upload/trash', authenticateToken, (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId;
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }
    const trashItems = loadTrashMeta().filter(item => item.tenantId === tenantId);
    
    // Add remaining time info
    const now = Date.now();
    const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours
    
    const itemsWithExpiry = trashItems.map(item => ({
      ...item,
      expiresIn: Math.max(0, RETENTION_MS - (now - item.deletedAt)),
      expiresAt: item.deletedAt + RETENTION_MS
    }));

    res.json({ success: true, items: itemsWithExpiry });
  } catch (error) {
    console.error('List trash error:', error);
    res.status(500).json({ success: false, error: 'Failed to list trash' });
  }
});

// POST /api/upload/restore - Restore image from trash
router.post('/api/upload/restore', authenticateToken, express.json(), (req: Request, res: Response) => {
  try {
    const { trashPath, tenantId } = req.body;
    if (!trashPath) return res.status(400).json({ success: false, error: 'Trash path is required' });
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }

    const trashItems = loadTrashMeta();
    const itemIndex = trashItems.findIndex(
      item => item.trashPath === trashPath && item.tenantId === tenantId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Trash item not found' });
    }

    const item = trashItems[itemIndex];
    const trashFilePath = path.join(baseUploadDir, item.trashPath.replace(/^\/uploads\//, ''));

    // Validate path stays within base upload directory
    if (!isPathSafe(trashFilePath, baseUploadDir)) {
      return res.status(400).json({ success: false, error: 'Invalid path' });
    }

    if (!fs.existsSync(trashFilePath)) {
      // Remove from metadata if file doesn't exist
      trashItems.splice(itemIndex, 1);
      saveTrashMeta(trashItems);
      return res.status(404).json({ success: false, error: 'File no longer exists' });
    }

    // Restore to original location
    const originalDir = item.folder
      ? path.join(uploadDir, item.folder, item.tenantId)
      : path.join(uploadDir, item.tenantId);
    
    fs.mkdirSync(originalDir, { recursive: true });
    
    const restoredPath = path.join(originalDir, item.filename);
    fs.renameSync(trashFilePath, restoredPath);

    // Remove from metadata
    trashItems.splice(itemIndex, 1);
    saveTrashMeta(trashItems);

    console.log(`[Trash] Restored: ${item.originalUrl}`);
    res.json({ success: true, imageUrl: item.originalUrl, message: 'Image restored successfully' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Restore failed' });
  }
});

// Cleanup function for expired trash items (call periodically)
const cleanupExpiredTrash = () => {
  try {
    const trashItems = loadTrashMeta();
    const now = Date.now();
    const RETENTION_MS = 24 * 60 * 60 * 1000;

    const activeItems: TrashItem[] = [];
    
    for (const item of trashItems) {
      if (now - item.deletedAt >= RETENTION_MS) {
        // Delete permanently
        const trashFilePath = path.join(baseUploadDir, item.trashPath.replace(/^\/uploads\//, ''));
        if (fs.existsSync(trashFilePath)) {
          fs.unlinkSync(trashFilePath);
          console.log(`[Trash] Permanently deleted: ${item.originalUrl}`);
        }
      } else {
        activeItems.push(item);
      }
    }

    if (activeItems.length !== trashItems.length) {
      saveTrashMeta(activeItems);
    }
  } catch (error) {
    console.error('[Trash] Cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredTrash, 60 * 60 * 1000);
// Also run on startup
cleanupExpiredTrash();

// ============================================================================
// FOLDER MANAGEMENT
// ============================================================================

// GET /api/upload/folders - List folders for tenant
router.get('/api/upload/folders', authenticateToken, (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId;
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }
    const galleryDir = path.join(uploadDir, 'gallery', tenantId);
    
    fs.mkdirSync(galleryDir, { recursive: true });
    
    const items = fs.readdirSync(galleryDir, { withFileTypes: true });
    const folders = items
      .filter(item => item.isDirectory())
      .map(item => ({
        name: item.name,
        path: `/uploads/images/gallery/${tenantId}/${item.name}`,
        createdAt: fs.statSync(path.join(galleryDir, item.name)).birthtime.toISOString()
      }));

    res.json({ success: true, folders });
  } catch (error) {
    console.error('List folders error:', error);
    res.status(500).json({ success: false, error: 'Failed to list folders' });
  }
});

// POST /api/upload/folders - Create new folder
router.post('/api/upload/folders', authenticateToken, express.json(), (req: Request, res: Response) => {
  try {
    const { tenantId, folderName } = req.body;
    
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }
    if (!folderName || typeof folderName !== 'string') {
      return res.status(400).json({ success: false, error: 'Folder name is required' });
    }
    
    // Sanitize folder name
    const safeName = folderName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').slice(0, 50);
    if (!safeName) {
      return res.status(400).json({ success: false, error: 'Invalid folder name' });
    }

    const galleryDir = path.join(uploadDir, 'gallery', tenantId);
    const folderPath = path.join(galleryDir, safeName);
    
    if (fs.existsSync(folderPath)) {
      return res.status(400).json({ success: false, error: 'Folder already exists' });
    }
    
    fs.mkdirSync(folderPath, { recursive: true });
    
    console.log(`[Folders] Created: ${safeName} for tenant ${tenantId}`);
    res.json({ 
      success: true, 
      folder: {
        name: safeName,
        path: `/uploads/images/gallery/${tenantId}/${safeName}`,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, error: 'Failed to create folder' });
  }
});

// PUT /api/upload/folders - Rename folder
router.put('/api/upload/folders', authenticateToken, express.json(), (req: Request, res: Response) => {
  try {
    const { tenantId, oldName, newName } = req.body;
    
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }
    if (!oldName || !newName) {
      return res.status(400).json({ success: false, error: 'Old and new folder names are required' });
    }
    
    const safeName = String(newName).trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').slice(0, 50);
    if (!safeName) {
      return res.status(400).json({ success: false, error: 'Invalid new folder name' });
    }

    const galleryDir = path.join(uploadDir, 'gallery', tenantId);
    const oldPath = path.join(galleryDir, String(oldName));
    const newPath = path.join(galleryDir, safeName);
    
    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }
    
    if (fs.existsSync(newPath)) {
      return res.status(400).json({ success: false, error: 'A folder with this name already exists' });
    }
    
    fs.renameSync(oldPath, newPath);
    
    console.log(`[Folders] Renamed: ${oldName} -> ${safeName}`);
    res.json({ success: true, message: 'Folder renamed successfully' });
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ success: false, error: 'Failed to rename folder' });
  }
});

// DELETE /api/upload/folders - Delete folder
router.delete('/api/upload/folders', authenticateToken, express.json(), (req: Request, res: Response) => {
  try {
    const { tenantId, folderName } = req.body;
    
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }
    if (!folderName) {
      return res.status(400).json({ success: false, error: 'Folder name is required' });
    }

    const galleryDir = path.join(uploadDir, 'gallery', tenantId);
    const folderPath = path.join(galleryDir, String(folderName));
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }
    
    // Check if folder is empty
    const files = fs.readdirSync(folderPath);
    if (files.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Folder is not empty. Move or delete images first.' 
      });
    }
    
    fs.rmdirSync(folderPath);
    
    console.log(`[Folders] Deleted: ${folderName}`);
    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete folder' });
  }
});

// POST /api/upload/move - Move image to folder
router.post('/api/upload/move', authenticateToken, express.json(), (req: Request, res: Response) => {
  try {
    const { imageUrl, targetFolder, tenantId } = req.body;
    
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid tenantId is required' });
    }
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'Image URL is required' });
    }

    const relative = String(imageUrl).replace(/^https?:\/\/[^/]+/i, '').trim();
    if (!relative.startsWith('/uploads/images/')) {
      return res.status(400).json({ success: false, error: 'Invalid image URL' });
    }

    // Parse current path
    const parts = relative.split('/').filter(Boolean);
    // uploads/images/gallery/tenantId/[folder/]filename
    const filename = parts[parts.length - 1];
    
    // Find current file path
    let currentPath: string | null = null;
    
    // Check in gallery root
    const rootPath = path.join(uploadDir, 'gallery', tenantId, filename);
    if (fs.existsSync(rootPath)) {
      currentPath = rootPath;
    }
    
    // Check in subfolders if not found in root
    if (!currentPath) {
      const galleryDir = path.join(uploadDir, 'gallery', tenantId);
      if (fs.existsSync(galleryDir)) {
        const folders = fs.readdirSync(galleryDir, { withFileTypes: true })
          .filter(d => d.isDirectory());
        
        for (const folder of folders) {
          const folderFilePath = path.join(galleryDir, folder.name, filename);
          if (fs.existsSync(folderFilePath)) {
            currentPath = folderFilePath;
            break;
          }
        }
      }
    }
    
    // Also check legacy paths (without gallery folder)
    if (!currentPath) {
      const legacyPath = path.join(uploadDir, tenantId, filename);
      if (fs.existsSync(legacyPath)) {
        currentPath = legacyPath;
      }
    }
    
    if (!currentPath) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }
    
    // Determine target path
    let targetPath: string;
    let newUrl: string;
    
    if (!targetFolder || targetFolder === '' || targetFolder === 'root') {
      // Move to gallery root
      targetPath = path.join(uploadDir, 'gallery', tenantId, filename);
      newUrl = `/uploads/images/gallery/${tenantId}/${filename}`;
    } else {
      // Move to specific folder
      const safeFolder = String(targetFolder).trim().replace(/[^a-zA-Z0-9_\-\s]/g, '');
      const targetDir = path.join(uploadDir, 'gallery', tenantId, safeFolder);
      fs.mkdirSync(targetDir, { recursive: true });
      targetPath = path.join(targetDir, filename);
      newUrl = `/uploads/images/gallery/${tenantId}/${safeFolder}/${filename}`;
    }
    
    if (currentPath === targetPath) {
      return res.json({ success: true, imageUrl: newUrl, message: 'Image already in target location' });
    }
    
    fs.renameSync(currentPath, targetPath);
    
    console.log(`[Move] Moved image to: ${newUrl}`);
    res.json({ success: true, imageUrl: newUrl, message: 'Image moved successfully' });
  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Move failed' });
  }
});

export default router;
