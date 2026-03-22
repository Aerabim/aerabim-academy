import type Mux from '@mux/mux-node';

type AssetOptions = NonNullable<Mux.Video.Uploads.UploadCreateParams['new_asset_settings']>;

/**
 * Default asset settings for all AerACADEMY video uploads.
 * Used by createMuxUploadUrl() when creating Direct Uploads.
 *
 * Note: `generated_subtitles` lives inside `inputs[0]` per Mux SDK types.
 * For direct uploads the first input has no URL (the file comes from the upload).
 */
export const AERACADEMY_ASSET_SETTINGS: AssetOptions = {
  max_resolution_tier: '1080p',
  normalize_audio: true,
  playback_policies: ['signed'],
  video_quality: 'plus',
  inputs: [
    {
      generated_subtitles: [
        { language_code: 'it', name: 'Italiano' },
      ],
    },
  ],
};
