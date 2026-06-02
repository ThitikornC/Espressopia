import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = import.meta.env.BASE_URL || '/'
const MAP_URL = `${BASE}assets/Espresso/Espresso/map.png`
const CUT_BASE = `${BASE}assets/Espresso/Espresso/VilageCutBG/`
const BGM_URL = `${BASE}assets/Espresso/MorningWalk.m4a`

const MAP_W = 1672, MAP_H = 941

// native pixel dimensions of each cut image
const VILLAGE_CUTS = {
  center: { url: `${CUT_BASE}Bearvillage.png`, w: 1415, h: 1111 },
  bar:    { url: `${CUT_BASE}Foxvillage.png`,  w: 1428, h: 1102 },
  garden: { url: `${CUT_BASE}Catvillage.png`,  w: 1419, h: 1109 },
  hotel:  { url: `${CUT_BASE}lionvillage.png`, w: 1405, h: 1119 },
  shop:   { url: `${CUT_BASE}wolfvillage.png`, w: 1370, h: 1148 },
}

const Corner = ({ rot = 0 }) => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none"
    style={{ transform: `rotate(${rot}deg)`, display: 'block' }}>
    <line x1="2" y1="2" x2="2" y2="38" stroke="#C8982C" strokeWidth="1.6" opacity="0.8" />
    <line x1="2" y1="2" x2="38" y2="2" stroke="#C8982C" strokeWidth="1.6" opacity="0.8" />
    <circle cx="2" cy="2" r="4" fill="#C8982C" opacity="0.9" />
    <circle cx="2" cy="2" r="2" fill="#2A1208" />
    <line x1="2" y1="26" x2="8" y2="26" stroke="#C8982C" strokeWidth="1" opacity="0.5" />
    <line x1="26" y1="2" x2="26" y2="8" stroke="#C8982C" strokeWidth="1" opacity="0.5" />
    <path d="M2,15 Q9,11 15,16 Q22,21 20,30" stroke="#C8982C" strokeWidth="0.9" fill="none" opacity="0.45" />
    <circle cx="20" cy="30" r="2" fill="#C8982C" opacity="0.4" />
  </svg>
)

/* Only the 5 animal cities that have a cut image. left/top = center of the
   city as % of the map image; w/h = clickable size as % of the map image. */
const VILLAGES = [
  { id: 'center', name: 'Bear',  left: 47, top: 37, w: 18, h: 26, route: null },
  { id: 'shop',   name: 'Wolf',  left: 27, top: 22, w: 16, h: 22, route: null },
  { id: 'hotel',  name: 'Lion',  left: 70, top: 20, w: 16, h: 22, route: null },
  { id: 'bar',    name: 'Fox',   left: 26, top: 56, w: 16, h: 22, route: '/Huaroi' },
  { id: 'garden', name: 'Cat',   left: 73, top: 56, w: 16, h: 22, route: null },
]

export default function WorldMap() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [playing, setPlaying] = useState(false)
  const containerRef = useRef(null)
  const audioRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 750 })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* looping background music (same track as Town view). Browsers block
     autoplay-with-sound, so try to autoplay then fall back to first interaction. */
  useLayoutEffect(() => {
    const audio = new Audio(BGM_URL)
    audio.loop = true
    audio.volume = 0.4
    audio.preload = 'auto'
    audioRef.current = audio
    audio.addEventListener('play',  () => setPlaying(true))
    audio.addEventListener('pause', () => setPlaying(false))

    const tryPlay = () => audio.play().then(() => true).catch(() => false)
    tryPlay().then(ok => {
      if (ok) return
      const start = () => { tryPlay(); cleanup() }
      const cleanup = () => {
        window.removeEventListener('pointerdown', start)
        window.removeEventListener('keydown', start)
        window.removeEventListener('touchstart', start)
      }
      window.addEventListener('pointerdown', start)
      window.addEventListener('keydown', start)
      window.addEventListener('touchstart', start)
    })
    return () => { audio.pause(); audio.src = ''; audioRef.current = null }
  }, [])

  const toggleSound = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  /* short hover blip via WebAudio (no extra asset needed) */
  const hoverBlip = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = (hoverBlip.ctx ||= new Ctx())
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(660, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch { /* ignore */ }
  }

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() =>
      setContainerSize({ w: el.clientWidth, h: el.clientHeight })
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // cover: fill the whole viewport, crop overflow
  const POPUP_SCALE = 0.62  // size of the village cut popup relative to fit-to-viewport
  const POPUP_SHIFT_Y = 0.25 // nudge popup down by this fraction of its height
  // cover: fill the whole viewport (map is 16:9, so crop is minimal)
  const mapScale = Math.max(containerSize.w / MAP_W, containerSize.h / MAP_H)
  const mapLeft  = (containerSize.w - MAP_W * mapScale) / 2
  const mapTop   = (containerSize.h - MAP_H * mapScale) / 2

  // a village is "active" when clicked (locked) or hovered — both show its popup
  const active = selected || hovered

  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden',
      backgroundColor: '#2D1008',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes frameGlow {
          0%,100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 0 14px rgba(230,180,40,0.18), inset 0 0 14px rgba(230,180,40,0.08); }
          50%     { box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 0 30px rgba(245,220,128,0.40), inset 0 0 22px rgba(245,220,128,0.16); }
        }
      `}</style>

      <div style={{
        position: 'relative', zIndex: 5,
        width: '100vw', height: '100dvh',
        /* dark tone behind the map so contain side-margins blend with its edges */
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, #1a0d05 0%, #0d0602 100%)',
        borderStyle: 'solid', borderWidth: '2px',
        borderImage: 'linear-gradient(135deg, #5a3c10 0%, #F5DC80 16%, #C8982C 34%, #7d5916 50%, #F5DC80 68%, #C8982C 86%, #5a3c10 100%) 1',
        boxSizing: 'border-box',
        overflow: 'hidden',
        animation: 'frameGlow 4.5s ease-in-out infinite',
      }}>
        <div style={{ position: 'absolute', top: -3, left: -3, zIndex: 22 }}><Corner rot={0} /></div>
        <div style={{ position: 'absolute', top: -3, right: -3, zIndex: 22 }}><Corner rot={90} /></div>
        <div style={{ position: 'absolute', bottom: -3, left: -3, zIndex: 22 }}><Corner rot={270} /></div>
        <div style={{ position: 'absolute', bottom: -3, right: -3, zIndex: 22 }}><Corner rot={180} /></div>


        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, pointerEvents: 'none',
          fontFamily: 'Georgia, serif', fontSize: 15, letterSpacing: 3,
          fontWeight: 700, textTransform: 'uppercase',
          backgroundImage: 'linear-gradient(180deg, #fff7e0 0%, #F5DC80 40%, #C8982C 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Esprestopia
        </div>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          aria-label={playing ? 'Mute music' : 'Play music'}
          style={{
            position: 'absolute', top: 10, right: 12, zIndex: 30,
            width: 38, height: 38, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(25,10,2,0.75)',
            border: '1.5px solid rgba(200,152,44,0.7)',
            color: '#F5DC80', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent', outline: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3z"/>
              <path d="M16 8a4 4 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.5 5.5a8 8 0 0 1 0 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3z"/>
              <path d="M16 9l5 5M21 9l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        {/* Map layer */}
        <div
          ref={containerRef}
          onClick={() => setSelected(null)}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Base map — grayscale when a village is active (hovered or selected) */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("${MAP_URL}")`,
            backgroundSize: `${MAP_W * mapScale}px ${MAP_H * mapScale}px`,
            backgroundPosition: `${mapLeft}px ${mapTop}px`,
            backgroundRepeat: 'no-repeat',
            filter: active ? 'grayscale(1) brightness(0.55)' : 'none',
            transition: 'filter 0.4s ease',
          }} />

          {/* Cut-image popup — shows on hover or click, anchored on its map position */}
          {Object.entries(VILLAGE_CUTS).map(([vid, cut]) => {
            const v = VILLAGES.find(x => x.id === vid)
            const fit = Math.min(containerSize.w / cut.w, containerSize.h / cut.h) * POPUP_SCALE
            const w = cut.w * fit, h = cut.h * fit
            // centre of the village on the map, in screen px
            const cx = mapLeft + (v.left / 100) * MAP_W * mapScale
            const cy = mapTop  + (v.top  / 100) * MAP_H * mapScale
            const on = active === vid
            return (
              <div key={vid} style={{
                position: 'absolute',
                left: cx - w / 2,
                top:  cy - h / 2 + h * POPUP_SHIFT_Y,
                width: w, height: h,
                backgroundImage: `url("${cut.url}")`,
                backgroundSize: 'contain', backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: on ? 1 : 0,
                transform: on ? 'scale(1)' : 'scale(0.92)',
                transformOrigin: 'center',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.6))',
                zIndex: 4,
              }} />
            )
          })}

          {/* Invisible clickable areas — anchored in map-image space so they
              track the buildings under the same scale + shift as the map */}
          {VILLAGES.map(v => {
            const cx = mapLeft + (v.left / 100) * MAP_W * mapScale
            const cy = mapTop  + (v.top  / 100) * MAP_H * mapScale
            const w  = (v.w / 100) * MAP_W * mapScale
            const h  = (v.h / 100) * MAP_H * mapScale
            return (
              <div
                key={v.id}
                onClick={e => {
                  e.stopPropagation()
                  if (selected === v.id) {
                    if (v.route) navigate(v.route)
                    else setSelected(null)
                  } else {
                    setSelected(v.id)
                  }
                }}
                onMouseEnter={() => { if (hovered !== v.id) hoverBlip(); setHovered(v.id) }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: cx, top: cy, width: w, height: h,
                  transform: 'translate(-50%,-50%)',
                  cursor: 'pointer',
                  zIndex: 3,
                  WebkitTapHighlightColor: 'transparent',
                }}
              />
            )
          })}
        </div>

        {/* Vignette */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
          boxShadow: 'inset 0 0 140px 50px rgba(8,3,0,0.7)',
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(4,1,0,0.25) 100%)',
        }} />
      </div>
    </div>
  )
}
