'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface SplashPageProps {
  isLoggedIn: boolean
}

const TAGLINE = 'La piattaforma di formazione BIM\nper i professionisti del settore AEC.'

export default function SplashPage({ isLoggedIn }: SplashPageProps) {
  const [mousePos, setMousePos]     = useState({ x: -9999, y: -9999 })
  const [mounted, setMounted]       = useState(false)
  const [typedText, setTypedText]   = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [btnOffset, setBtnOffset]   = useState({ x: 0, y: 0 })
  const btnRef   = useRef<HTMLAnchorElement>(null)
  const rafRef   = useRef<number | null>(null)
  const targetMouseRef = useRef({ x: -9999, y: -9999 })
  const smoothMouseRef = useRef({ x: -9999, y: -9999 })

  // Smooth mouse lerp via rAF
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  useEffect(() => {
    setMounted(true)

    const tick = () => {
      smoothMouseRef.current = {
        x: lerp(smoothMouseRef.current.x, targetMouseRef.current.x, 0.08),
        y: lerp(smoothMouseRef.current.y, targetMouseRef.current.y, 0.08),
      }
      setMousePos({ ...smoothMouseRef.current })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Typewriter — starts after 700 ms
  useEffect(() => {
    if (!mounted) return
    let i = 0
    const delay = setTimeout(() => {
      const timer = setInterval(() => {
        if (i < TAGLINE.length) {
          setTypedText(TAGLINE.slice(0, i + 1))
          i++
        } else {
          clearInterval(timer)
          // blink cursor a few seconds then hide
          setTimeout(() => setCursorVisible(false), 3000)
        }
      }, 32)
      return () => clearInterval(timer)
    }, 700)
    return () => clearTimeout(delay)
  }, [mounted])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    targetMouseRef.current = { x: e.clientX, y: e.clientY }

    // Magnetic button
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const threshold = 110
      if (dist < threshold) {
        const force = (threshold - dist) / threshold
        setBtnOffset({ x: dx * force * 0.4, y: dy * force * 0.4 })
      } else {
        setBtnOffset({ x: 0, y: 0 })
      }
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setBtnOffset({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  // Parallax helpers
  const getParallax = (depth: number) => {
    if (!mounted || smoothMouseRef.current.x < 0) return { x: 0, y: 0 }
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    return {
      x: ((smoothMouseRef.current.x - cx) / cx) * depth,
      y: ((smoothMouseRef.current.y - cy) / cy) * depth,
    }
  }

  const getTilt = () => {
    if (!mounted || smoothMouseRef.current.x < 0) return { rx: 0, ry: 0 }
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    return {
      rx: ((smoothMouseRef.current.y - cy) / cy) * -7,
      ry: ((smoothMouseRef.current.x - cx) / cx) * 7,
    }
  }

  const p1    = getParallax(-24)
  const p2    = getParallax(-14)
  const p3    = getParallax(10)
  const tilt  = getTilt()

  const spotX = mousePos.x
  const spotY = mousePos.y

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-brand-dark select-none">

      {/* ── Blueprint grid (revealed by spotlight) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(78,205,196,0.07) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(78,205,196,0.07) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '56px 56px',
          WebkitMaskImage: `radial-gradient(ellipse 380px 380px at ${spotX}px ${spotY}px, black 0%, transparent 100%)`,
          maskImage:       `radial-gradient(ellipse 380px 380px at ${spotX}px ${spotY}px, black 0%, transparent 100%)`,
        }}
      />

      {/* Smaller dense inner grid (same mask, sharper center) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(78,205,196,0.04) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(78,205,196,0.04) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '14px 14px',
          WebkitMaskImage: `radial-gradient(ellipse 180px 180px at ${spotX}px ${spotY}px, black 0%, transparent 100%)`,
          maskImage:       `radial-gradient(ellipse 180px 180px at ${spotX}px ${spotY}px, black 0%, transparent 100%)`,
        }}
      />

      {/* Spotlight ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 500px 500px at ${spotX}px ${spotY}px, rgba(78,205,196,0.055) 0%, transparent 70%)`,
        }}
      />

      {/* ── Orbs — parallax layer 1 (deep back) ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 720, height: 720,
          background: 'radial-gradient(circle, rgba(78,205,196,0.13) 0%, transparent 65%)',
          filter: 'blur(90px)',
          top: '-8%', left: '5%',
          transform: `translate(${p1.x}px, ${p1.y}px)`,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 560, height: 560,
          background: 'radial-gradient(circle, rgba(240,165,0,0.10) 0%, transparent 65%)',
          filter: 'blur(80px)',
          bottom: '-5%', right: '5%',
          transform: `translate(${-p1.x}px, ${-p1.y * 0.6}px)`,
        }}
      />

      {/* ── Orbs — parallax layer 2 (mid) ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 420, height: 420,
          background: 'radial-gradient(circle, rgba(48,64,87,0.55) 0%, transparent 65%)',
          filter: 'blur(70px)',
          top: '38%', right: '18%',
          transform: `translate(${p2.x}px, ${p2.y}px)`,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(160,107,214,0.08) 0%, transparent 65%)',
          filter: 'blur(60px)',
          bottom: '20%', left: '12%',
          transform: `translate(${-p2.x * 0.8}px, ${p2.y}px)`,
        }}
      />

      {/* ── Center content — 3D tilt + foreground parallax ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <div
          className={`flex flex-col items-center gap-8 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translate(${p3.x}px, ${p3.y}px)`,
          }}
        >
          {/* Brand label */}
          <div
            className="animate-fadeIn"
            style={{ transform: 'translateZ(10px)', animationDelay: '0.1s', opacity: 0 }}
          >
            <span className="font-sans text-[11px] tracking-[0.35em] text-text-muted uppercase">
              AERABIM S.R.L.
            </span>
          </div>

          {/* Main title */}
          <div
            className="animate-fadeIn"
            style={{ transform: 'translateZ(50px)', animationDelay: '0.25s', opacity: 0 }}
          >
            <h1
              className="font-heading font-bold leading-none tracking-tight text-center"
              style={{
                fontSize: 'clamp(3.2rem, 9vw, 7.5rem)',
                background: 'linear-gradient(135deg, #EAF0F4 20%, #4ECDC4 55%, #9DB1BF 85%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
              }}
            >
              AerACADEMY
            </h1>
          </div>

          {/* Divider */}
          <div
            className="animate-fadeIn"
            style={{ transform: 'translateZ(30px)', animationDelay: '0.4s', opacity: 0 }}
          >
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-accent-cyan/35 to-transparent" />
          </div>

          {/* Tagline — typewriter */}
          <div
            className="animate-fadeIn"
            style={{ transform: 'translateZ(30px)', animationDelay: '0.5s', opacity: 0 }}
          >
            <p className="font-sans text-text-secondary text-base text-center leading-relaxed max-w-xs whitespace-pre-line min-h-[3rem]">
              {typedText}
              {cursorVisible && (
                <span className="inline-block w-[2px] h-[1em] bg-accent-cyan/70 ml-[1px] align-middle animate-pulse" />
              )}
            </p>
          </div>

          {/* CTA — magnetic button */}
          <div
            className="animate-fadeIn mt-2"
            style={{ transform: 'translateZ(70px)', animationDelay: '0.65s', opacity: 0 }}
          >
            <a
              ref={btnRef}
              href={isLoggedIn ? '/dashboard' : '/login'}
              className="relative inline-flex items-center gap-3 px-9 py-[1.1rem] rounded-full font-sans font-semibold text-[0.95rem] text-brand-dark bg-accent-cyan group overflow-visible"
              style={{
                transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)`,
                transition: 'transform 0.18s cubic-bezier(0.23,1,0.32,1), background-color 0.2s',
                boxShadow: '0 0 0 0 rgba(78,205,196,0)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 32px 4px rgba(78,205,196,0.25)'
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#fff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 0 0 rgba(78,205,196,0)'
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''
              }}
            >
              {/* Pulse rings */}
              <span className="absolute inset-0 rounded-full bg-accent-cyan/25 animate-pulseRing pointer-events-none" />
              <span
                className="absolute inset-0 rounded-full bg-accent-cyan/15 animate-pulseRing pointer-events-none"
                style={{ animationDelay: '0.8s' }}
              />

              <span className="relative z-10">
                {isLoggedIn ? 'Vai alla Dashboard' : 'Accedi alla Piattaforma'}
              </span>
              <svg
                className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── Corner micro-labels ── */}
      <div className={`absolute top-6 left-8 font-sans text-[11px] tracking-widest text-text-muted/35 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        academy.aerabim.it
      </div>
      <div className={`absolute bottom-6 right-8 font-sans text-[11px] text-text-muted/25 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        © 2026 AERABIM S.R.L.
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none bg-gradient-to-t from-brand-dark to-transparent" />
    </div>
  )
}
