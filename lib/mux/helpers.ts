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

/**
 * Creates a Mux Direct Upload URL for a course preview clip.
 * Uses PUBLIC playback policy (no JWT needed) so the browser can play it directly.
 * The courseId is stored in `passthrough` with type='preview' so the webhook
 * can write preview_playback_id and preview_asset_id to the course row.
 */
export async function createMuxPreviewUploadUrl(
  courseId: string,
): Promise<MuxUploadResult> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux non configurato: MUX_TOKEN_ID o MUX_TOKEN_SECRET mancante');
  }

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policies: ['public'],
      video_quality: 'basic',
      passthrough: JSON.stringify({ type: 'preview', courseId }),
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
  });

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  };
}

/**
 * Creates a Mux Direct Upload URL for a learning path preview video.
 * Uses PUBLIC playback policy (no JWT needed) so the browser can play it directly.
 * The pathId is stored in `passthrough` with type='path_preview' so the webhook
 * can write preview_playback_id and preview_asset_id to the learning_paths row.
 */
export async function createMuxPathPreviewUploadUrl(
  pathId: string,
): Promise<MuxUploadResult> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux non configurato: MUX_TOKEN_ID o MUX_TOKEN_SECRET mancante');
  }

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policies: ['public'],
      video_quality: 'basic',
      passthrough: JSON.stringify({ type: 'path_preview', pathId }),
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
  });

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  };
}

/**
 * Creates a Mux Direct Upload URL for a feed post video.
 * Uses PUBLIC playback policy for autoplay in the feed (no JWT needed).
 * The postId is stored in passthrough so the webhook can write media_url
 * to the feed_posts row after the asset is ready.
 */
export async function createMuxFeedVideoUploadUrl(
  postId: string,
): Promise<MuxUploadResult> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux non configurato: MUX_TOKEN_ID o MUX_TOKEN_SECRET mancante');
  }

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policies: ['public'],
      video_quality: 'basic',
      passthrough: JSON.stringify({ type: 'feed_video', postId }),
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
  });

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  };
}

// ── Live Stream Helpers ─────────────────────────────

export interface MuxLiveStreamResult {
  liveStreamId: string;
  streamKey: string;
  playbackId: string;
}

/**
 * Creates a Mux live stream for a webinar session.
 * The live stream uses signed playback, low latency, and auto-recording.
 * The `passthrough` stores the session ID for webhook association.
 */
export async function createMuxLiveStream(sessionId: string): Promise<MuxLiveStreamResult> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux non configurato: MUX_TOKEN_ID o MUX_TOKEN_SECRET mancante');
  }

  const liveStream = await mux.video.liveStreams.create({
    playback_policies: ['signed'],
    new_asset_settings: {
      playback_policies: ['signed'],
    },
    max_continuous_duration: 14400, // 4 hours max
    latency_mode: 'low',
    passthrough: JSON.stringify({ sessionId }),
  });

  const playbackId = liveStream.playback_ids?.[0]?.id;
  if (!playbackId || !liveStream.stream_key) {
    throw new Error('Mux live stream creato senza playback ID o stream key');
  }

  return {
    liveStreamId: liveStream.id,
    streamKey: liveStream.stream_key,
    playbackId,
  };
}
