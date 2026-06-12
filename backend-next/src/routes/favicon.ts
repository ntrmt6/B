import { Router, Request, Response } from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const router = Router();

const PUBLIC_DIR = '/var/www/html/main-admin/public';
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }
    
    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create icons directory if it doesn't exist
    if (!fs.existsSync(ICONS_DIR)) {
      fs.mkdirSync(ICONS_DIR, { recursive: true });
    }
    
    const sizes = [
      { name: 'icon-16x16.png', size: 16 },
      { name: 'icon-32x32.png', size: 32 },
      { name: 'icon-72x72.png', size: 72 },
      { name: 'icon-96x96.png', size: 96 },
      { name: 'icon-128x128.png', size: 128 },
      { name: 'icon-144x144.png', size: 144 },
      { name: 'icon-152x152.png', size: 152 },
      { name: 'icon-192x192.png', size: 192 },
      { name: 'icon-384x384.png', size: 384 },
      { name: 'icon-512x512.png', size: 512 },
      { name: 'apple-touch-icon.png', size: 180 }
    ];
    
    const created: string[] = [];
    
    for (const { name, size } of sizes) {
      await sharp(imageBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(ICONS_DIR, name));
      created.push(name);
    }
    
    // Also create favicon.png in public root
    await sharp(imageBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
    created.push('favicon.png');
    
    // Save original for reference
    await sharp(imageBuffer)
      .png()
      .toFile(path.join(ICONS_DIR, 'original-logo.png'));
    created.push('original-logo.png');
    
    console.log('[Favicon] Generated icons:', created);
    
    res.json({
      success: true,
      message: 'Favicon icons generated successfully',
      icons: created
    });
    
  } catch (error: any) {
    console.error('[Favicon] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status', (_req: Request, res: Response) => {
  const icons = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'));
  res.json({
    success: true,
    iconsDir: ICONS_DIR,
    icons
  });
});

export default router;
