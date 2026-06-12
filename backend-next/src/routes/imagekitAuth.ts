import { Router, Request, Response } from 'express';
import ImageKit from 'imagekit';
import { env } from '../config/env';

const router = Router();

/**
 * GET /api/v1/upload-auth
 * Returns ImageKit authentication parameters for client-side uploads.
 * Only works when IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and
 * IMAGEKIT_URL_ENDPOINT are set in the environment.
 */
router.get('/upload-auth', (req: Request, res: Response) => {
  if (!env.imagekitPublicKey || !env.imagekitPrivateKey || !env.imagekitUrlEndpoint) {
    return res.status(503).json({ error: 'ImageKit is not configured on the server' });
  }

  try {
    const imagekit = new ImageKit({
      publicKey: env.imagekitPublicKey,
      privateKey: env.imagekitPrivateKey,
      urlEndpoint: env.imagekitUrlEndpoint,
    });

    const result = imagekit.getAuthenticationParameters();
    res.json(result);
  } catch (error) {
    console.error('[ImageKit] Auth error:', error);
    res.status(500).json({ error: 'Failed to generate ImageKit auth parameters' });
  }
});

export default router;
