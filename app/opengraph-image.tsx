import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'AerACADEMY — Formazione BIM Professionale';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#040B11',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background glow — cyan */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-60px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(78,205,196,0.15) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Background glow — amber */}
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            right: '-40px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,165,0,0.12) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            zIndex: 1,
          }}
        >
          {/* Brand label */}
          <span
            style={{
              fontSize: '14px',
              letterSpacing: '0.3em',
              color: '#58758C',
              textTransform: 'uppercase',
            }}
          >
            AERABIM S.R.L.
          </span>

          {/* Title */}
          <div
            style={{
              fontSize: '96px',
              fontWeight: 800,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #EAF0F4 20%, #4ECDC4 55%, #9DB1BF 85%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            AerACADEMY
          </div>

          {/* Divider */}
          <div
            style={{
              width: '1px',
              height: '40px',
              background: 'linear-gradient(to bottom, transparent, rgba(78,205,196,0.4), transparent)',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: '22px',
              color: '#8BA0B2',
              textAlign: 'center',
              maxWidth: '600px',
              lineHeight: 1.5,
            }}
          >
            La piattaforma di formazione BIM{'\n'}per i professionisti del settore AEC
          </div>

          {/* URL pill */}
          <div
            style={{
              marginTop: '8px',
              padding: '8px 20px',
              borderRadius: '999px',
              border: '1px solid rgba(78,205,196,0.2)',
              fontSize: '14px',
              color: '#4ECDC4',
              letterSpacing: '0.05em',
            }}
          >
            academy.aerabim.it
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
