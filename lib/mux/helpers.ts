import { sign } from 'crypto';
import Mux from '@mux/mux-node';
import { AERACADEMY_ASSET_SETTINGS } from './config';

let muxInstance: Mux | null = null;

/**
 * Returns a Mux server-side client, or null if credentials are not configured.
 * Singleton — reused across requests in the same process.
 */
export function getMuxClient(): Mux | null {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    return null;
  }

  if (!muxInstance) {
    muxInstance = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
  }

  return muxInstance;
}

export interface MuxPlaybackTokens {
  playback: string;
  thumbnail: string;
  storyboard: string;
}

/** Mux audience claims: v = video, t = thumbnail, s = storyboard */
type MuxAudience = 'v' | 't' | 's';

let signingKeyPem: string | null = null;

/**
 * Signs a Mux JWT with RS256, including `kid` in the header as required by Mux.
 * Uses Node crypto directly because the SDK omits `kid` from the JWT header.
 */
function signMuxJwt(playbackId: string, audience: MuxAudience, expiresInSec: number): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keyBase64 = process.env.MUX_SIGNING_KEY_PRIVATE_KEY;

  if (!keyId || !keyBase64) {
    throw new Error('Mux signing key non configurata: MUX_SIGNING_KEY_ID o MUX_SIGNING_KEY_PRIVATE_KEY mancante');
  }

  if (!signingKeyPem) {
    signingKeyPem = Buffer.from(keyBase64, 'base64').toString('utf-8');
  }

  const b64url = (obj: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const header = { alg: 'RS256', typ: 'JWT', kid: keyId };
  const payload = {
    sub: playbackId,
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + expiresInSec,
    kid: keyId,
  };

  const unsigned = b64url(header) + '.' + b64url(payload);
  const signature = sign('sha256', Buffer.from(unsigned), signingKeyPem);

  return unsigned + '.' + signature.toString('base64url');
}

const FOUR_HOURS = 4 * 60 * 60;

/**
 * Generates signed JWT tokens for a Mux playback ID.
 * Returns tokens for video playback, thumbnail, and storyboard.
 * Tokens expire in 4 hours.
 */
export function generatePlaybackTokens(playbackId: string): MuxPlaybackTokens {
  return {
    playback: signMuxJwt(playbackId, 'v', FOUR_HOURS),
    thumbnail: signMuxJwt(playbackId, 't', FOUR_HOURS),
    storyboard: signMuxJwt(playbackId, 's', FOUR_HOURS),
  };
}

interface MuxUploadResult {
  uploadUrl: string;
  uploadId: string;
}

/**
 * Creates a Mux Direct Upload URL for a specific lesson.
 * The lessonId and courseId are stored in `passthrough` so the webhook
 * can associate the ready asset with the correct lesson row.
 */
export async function createMuxUploadUrl(
  lessonId: string,
  courseId: string,
): Promise<MuxUploadResult> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux non configurato: MUX_TOKEN_ID o MUX_TOKEN_SECRET mancante');
  }

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      ...AERACADEMY_ASSET_SETTINGS,
      passthrough: JSON.stringify({ lessonId, courseId }),
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
  });

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  };
}
