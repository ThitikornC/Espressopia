import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MATCHIKATREE } from './sprites.jsx'

function SpriteAnim({ sprite, size, style = {} }) {
  const total = sprite.cols * sprite.rows
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % total), 1000 / sprite.fps)
    return () => clearInterval(id)
  }, [total, sprite.fps])
  const col = frame % sprite.cols
  const row = Math.floor(frame / sprite.cols)
  return (
    <div style={{
      width: size, height: size,
      backgroundImage: `url("${sprite.url}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${sprite.cols * 100}% ${sprite.rows * 100}%`,
      backgroundPosition: `${(col / (sprite.cols - 1)) * 100}% ${(row / (sprite.rows - 1)) * 100}%`,
      imageRendering: 'pixelated',
      pointerEvents: 'none',
      ...style,
    }} />
  )
}

function SpriteAnimPingPong({ sprite, size, style = {} }) {
  const total = sprite.cols * sprite.rows
  const [frame, setFrame] = useState(0)
  const dirRef = useRef(1)
  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => {
        const next = f + dirRef.current
        if (next >= total - 1) dirRef.current = -1
        if (next <= 0) dirRef.current = 1
        return next
      })
    }, 1000 / sprite.fps)
    return () => clearInterval(id)
  }, [total, sprite.fps])
  const col = frame % sprite.cols
  const row = Math.floor(frame / sprite.cols)
  return (
    <div style={{
      width: size, height: size,
      backgroundImage: `url("${sprite.url}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${sprite.cols * 100}% ${sprite.rows * 100}%`,
      backgroundPosition: `${(col / (sprite.cols - 1)) * 100}% ${(row / (sprite.rows - 1)) * 100}%`,
      imageRendering: 'pixelated',
      pointerEvents: 'none',
      ...style,
    }} />
  )
}

function MatchikatreeSprite({ size = 180, style = {} }) {
  return <SpriteAnim sprite={MATCHIKATREE} size={size} style={style} />
}

const BASE     = import.meta.env.BASE_URL || '/'
const IMG_DIR  = `${BASE}assets/Espresso/Espresso/`
const TILE_DIR = `${IMG_DIR}opt/`                 // downscaled tiles (small files)
const BG_URL   = `${TILE_DIR}BG.jpg`
const BG_H_URL = `${TILE_DIR}BG_H.jpg`

const BEARTESTANDING = {
  url: `${IMG_DIR}Beartestanding.webp`,
  cols: 5, rows: 5, fps: 16,
}
const FOXCAMUSIC = {
  url: `${IMG_DIR}Foxcamusic.webp`,
  cols: 5, rows: 5, fps: 16,
}
const CATRAMELPOST = {
  url: `${IMG_DIR}Catramelpost.webp`,
  cols: 5, rows: 5, fps: 16,
}
const CAPULIONCOFFEE = {
  url: `${IMG_DIR}Capulioncoffee.webp`,
  cols: 5, rows: 5, fps: 16,
}
const WOLFLICANOPOST = {
  url: `${IMG_DIR}Wolflicanopost.webp`,
  cols: 5, rows: 5, fps: 16,
}
const OLIANGPHANTMAP = {
  url: `${IMG_DIR}Oliangphantmap.webp`,
  cols: 5, rows: 5, fps: 16,
}
const FLAMINGSHAKEMOVIE = {
  url: `${IMG_DIR}Flamingshakemovie.webp`,
  cols: 5, rows: 5, fps: 16,
}
const PENGURTCAKE = {
  url: `${IMG_DIR}Pengurtcake.webp`,
  cols: 5, rows: 5, fps: 16,
}
const THAIGERFIX = {
  url: `${IMG_DIR}Thaigerfix.webp`,
  cols: 5, rows: 5, fps: 16,
}
const BGM_URL  = `${BASE}assets/Espresso/MorningWalk.m4a`

/* ─── Scale derived from assembled image (Group 30.png = 17324×13436 px) ───
   Step_x = 4335 px, Step_y = 4368 px  (tiles barely touch in assembled)
   Display at 900 px width → S = 900/17324 ≈ 0.05196
   Each tile rendered at its NATURAL scaled size (no distortion)          */
const S  = 900 / 17324
/* TIGHT pulls tiles together so hex edges nest (PNGs carry transparent padding) */
const TIGHT_X = 1
const TIGHT_Y = 0.65
const SX = 4335 * S * TIGHT_X   // horizontal step
const SY = 4368 * S * TIGHT_Y   // vertical step

/* tile grid — (iw, ih) are original PNG dimensions.
   bx/by = the hex base's BOTTOM VERTEX in PNG px (measured from the artwork).
   Aligning every tile by this point puts all ground hexagons on one lattice,
   no matter how tall the building rises above it.
   Inverted-pyramid honeycomb (4-3-2-1): each row nests +0.5 into the gaps
   of the row above, widest at top → single Cinema tile at the bottom point. */
const TILES = [
  /* ── Row 0 (top, 4 tiles) ── */
  { id:'bar',      src:'bar.webp',      name:'Bar',      iw:4309, ih:4530, bx:2238, by:4530, cx: 0.0, ry: 0 },
  { id:'temple',   src:'temple.webp',   name:'Temple',   iw:4562, ih:5161, bx:2274, by:5161, cx: 1.0, ry: 0 },
  { id:'garden',   src:'garden.webp',   name:'Garden',   iw:4489, ih:4575, bx:2278, by:4575, cx: 2.0, ry: 0 },
  { id:'hotel',    src:'Hotel.webp',    name:'Hotel',    iw:4319, ih:4685, bx:2210, by:4685, cx: 3.0, ry: 0 },
  /* ── Row 1 (3 tiles, offset +0.5) ── */
  { id:'shop',     src:'shop.webp',     name:'Shop',     iw:4467, ih:4700, bx:2238, by:4700, cx: 0.5, ry: 1 },
  { id:'center',   src:'Center.webp',   name:'Center',   iw:4314, ih:4822, bx:2150, by:4822, cx: 1.5, ry: 1 },
  { id:'vilage',   src:'vilage.webp',   name:'Village',  iw:4535, ih:4307, bx:2272, by:4307, cx: 2.5, ry: 1 },
  /* ── Row 2 (2 tiles, offset +1.0) ── */
  { id:'workshop', src:'workshop.webp', name:'Workshop', iw:4300, ih:5038, bx:2174, by:5038, cx: 1.0, ry: 2 },
  { id:'campus',   src:'campus.webp',   name:'Campus',   iw:4618, ih:5244, bx:2398, by:5244, cx: 2.0, ry: 2 },
  /* ── Row 3 (1 tile, bottom point, offset +1.5) ── */
  { id:'cinema',   src:'cinrma.webp',   name:'Cinema',   iw:5020, ih:4912, bx:2534, by:4912, cx: 1.5, ry: 3 },
]

/* compute display pixel positions & sizes
   Anchor each tile by its measured hex base bottom-vertex (bx,by) so every
   ground hexagon lands on the same lattice regardless of building height. */
let tiles = TILES.map(t => {
  const dw = t.iw * S
  const dh = t.ih * S
  const latX = t.cx * SX        // lattice position of this hex's base vertex
  const latY = t.ry * SY
  return {
    ...t, dw, dh,
    x: latX - t.bx * S,         // left so base vertex lands on lattice x
    y: latY - t.by * S,         // top  so base vertex lands on lattice y
  }
})

/* shift everything into positive space (some x/y go negative after centering) */
const minX = Math.min(...tiles.map(t => t.x))
const minY = Math.min(...tiles.map(t => t.y))
tiles = tiles.map(t => ({ ...t, x: t.x - minX, y: t.y - minY }))

/* bounding box of the entire map */
const MAP_W = Math.ceil(tiles.reduce((m,t)=>Math.max(m, t.x+t.dw), 0))
const MAP_H = Math.ceil(tiles.reduce((m,t)=>Math.max(m, t.y+t.dh), 0))

/* ── Frame corner ornament ── */
const Corner = ({ rot=0 }) => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none"
       style={{ transform:`rotate(${rot}deg)`, display:'block' }}>
    <line x1="2" y1="2" x2="2" y2="38" stroke="#C8982C" strokeWidth="1.6" opacity="0.8"/>
    <line x1="2" y1="2" x2="38" y2="2" stroke="#C8982C" strokeWidth="1.6" opacity="0.8"/>
    <circle cx="2" cy="2" r="4" fill="#C8982C" opacity="0.9"/>
    <circle cx="2" cy="2" r="2" fill="#2A1208"/>
    <line x1="2" y1="26" x2="8" y2="26" stroke="#C8982C" strokeWidth="1" opacity="0.5"/>
    <line x1="26" y1="2" x2="26" y2="8" stroke="#C8982C" strokeWidth="1" opacity="0.5"/>
    <path d="M2,15 Q9,11 15,16 Q22,21 20,30" stroke="#C8982C" strokeWidth="0.9" fill="none" opacity="0.45"/>
    <circle cx="20" cy="30" r="2" fill="#C8982C" opacity="0.4"/>
  </svg>
)

/* ── Ambient golden motes (fireflies / drifting dust) over the whole scene ── */
const rnd = (a, b) => a + Math.random() * (b - a)
const MOTES = Array.from({ length: 30 }, () => ({
  left: rnd(1, 99), top: rnd(4, 95),
  size: rnd(2, 5).toFixed(1),
  dx: `${rnd(-45, 45).toFixed(0)}px`,
  dy: `${rnd(-55, -15).toFixed(0)}px`,   // drift gently upward
  dt: `${rnd(8, 17).toFixed(1)}s`,       // drift duration
  tw: `${rnd(2.5, 6).toFixed(1)}s`,      // twinkle duration
  delay: `${rnd(0, 9).toFixed(1)}s`,
  o0: rnd(0.04, 0.22).toFixed(2),        // dim point of the twinkle
  o1: rnd(1, 0.95).toFixed(2),         // bright point of the twinkle
}))

function Ambience() {
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none', overflow:'hidden' }}>
      <style>{`
        @keyframes moteDrift   { from { transform: translate(0,0) } to { transform: translate(var(--dx), var(--dy)) } }
        @keyframes moteTwinkle { 0%,100% { opacity: var(--o0) } 50% { opacity: var(--o1) } }
      `}</style>
      {MOTES.map((m, i) => (
        <span key={i} style={{
          position:'absolute', left:`${m.left}%`, top:`${m.top}%`,
          width:`${m.size}px`, height:`${m.size}px`, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(255,230,160,0.95) 0%, rgba(230,180,40,0.55) 45%, rgba(230,180,40,0) 72%)',
          boxShadow:'0 0 6px 2px rgba(255,200,90,0.45)',
          '--dx':m.dx, '--dy':m.dy, '--o0':m.o0, '--o1':m.o1,
          animation:`moteDrift ${m.dt} ease-in-out ${m.delay} infinite alternate, moteTwinkle ${m.tw} ease-in-out ${m.delay} infinite`,
        }}/>
      ))}
    </div>
  )
}

const isTouchDevice = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

function requestFullscreen() {
  const el = document.documentElement
  if (document.fullscreenElement || document.webkitFullscreenElement) return
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
}

export default function Espressopia() {
  const [hov, setHov] = useState(null)
  const areaRef = useRef(null)
  const titleRef = useRef(null)
  const [scale, setScale] = useState(1)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const navigate = useNavigate()
  const logoUrl = `${BASE}assets/Espresso/Espresso/ESPRESSOPHIA.png`
  const [winSize, setWinSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /* track fullscreen state */
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const isPortrait = winSize.h > winSize.w
  const isMobileLandscape = !isPortrait && winSize.h < 550

  /* auto-request fullscreen when entering landscape on mobile */
  useEffect(() => {
    if (!isMobileLandscape || !isTouchDevice()) return
    requestFullscreen()
    const onInteract = () => requestFullscreen()
    window.addEventListener('touchstart', onInteract, { once: true, passive: true })
    window.addEventListener('pointerdown', onInteract, { once: true })
    return () => {
      window.removeEventListener('touchstart', onInteract)
      window.removeEventListener('pointerdown', onInteract)
    }
  }, [isMobileLandscape])

  useEffect(() => {
    new Image().src = BG_URL
    new Image().src = BG_H_URL
  }, [])

  /* Scale the map to fit the space left under the title, so the title+map block
     stays one centred group on every aspect ratio (no big empty gap). */
  useLayoutEffect(() => {
    const area = areaRef.current
    if (!area) return
    const fit = () => {
      const w = area.clientWidth
      const h = area.clientHeight
      const th = titleRef.current ? titleRef.current.offsetHeight : 0
      const availH = h - th - 8        // 8px gap between title and map
      if (w > 0 && availH > 0) {
        setScale(Math.max(0.05, Math.min(w / MAP_W, availH / MAP_H, 1)))
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(area)
    if (titleRef.current) ro.observe(titleRef.current)
    return () => ro.disconnect()
  }, [])

  /* looping background music. Browsers block autoplay-with-sound, so we:
     1) try to autoplay,
     2) if blocked, start on the first user interaction,
     3) and always expose a manual sound toggle button. */
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

  return (
    <div style={{
      position:'relative', width:'100vw', height:'100dvh', overflow:'hidden',
      backgroundColor:'#2D1008',
      backgroundImage:[
        'radial-gradient(ellipse 100% 55% at 50% 0%,   rgba(80,30,4,0.45)  0%,transparent 60%)',
        'radial-gradient(ellipse 40% 100% at 0%   50%, rgba(10,2,0,0.45)   0%,transparent 55%)',
        'radial-gradient(ellipse 40% 100% at 100% 50%, rgba(10,2,0,0.45)   0%,transparent 55%)',
        'radial-gradient(ellipse 100% 55% at 50% 100%, rgba(6,1,0,0.55)    0%,transparent 60%)',
        `url("${isPortrait ? BG_H_URL : BG_URL}")`,
      ].join(', '),
      backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>

      {/* ── Tap-to-fullscreen hint (mobile landscape only) ── */}
      {isMobileLandscape && !isFullscreen && isTouchDevice() && (
        <div
          onClick={requestFullscreen}
          style={{
            position:'absolute', top:0, left:0, right:0, zIndex:100,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'6px 12px',
            background:'linear-gradient(180deg, rgba(20,8,2,0.85) 0%, rgba(20,8,2,0) 100%)',
            cursor:'pointer', pointerEvents:'auto',
          }}
        >
          <span style={{
            fontFamily:'Georgia, serif', fontSize:11, letterSpacing:1,
            color:'rgba(245,220,128,0.85)',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h7v2H5v5H3V3zm11 0h7v7h-2V5h-5V3zM3 14h2v5h5v2H3v-7zm16 5h-5v2h7v-7h-2v5z"/>
            </svg>
            แตะเพื่อเต็มจอ
          </span>
        </div>
      )}

      {/* ── Golden motes drifting around the town ── */}
      <Ambience />

      {/* ── Golden frame (glossy metallic) ── */}
      <style>{`@keyframes frameGlow {
        0%,100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 0 14px rgba(230,180,40,0.18), inset 0 0 14px rgba(230,180,40,0.08); }
        50%     { box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 0 30px rgba(245,220,128,0.40), inset 0 0 22px rgba(245,220,128,0.16); }
      }`}</style>
      <div style={{
        position:'relative', zIndex:5,
        width:'calc(100% - 28px)', height:'calc(100% - 20px)', maxWidth:1400,
        borderStyle:'solid', borderWidth:'2px',
        borderImage:'linear-gradient(135deg, #5a3c10 0%, #F5DC80 16%, #C8982C 34%, #7d5916 50%, #F5DC80 68%, #C8982C 86%, #5a3c10 100%) 1',
        boxSizing:'border-box',
        display:'flex', flexDirection:'column', alignItems:'center',
        padding:'4px 8px 8px',
        animation:'frameGlow 4.5s ease-in-out infinite',
      }}>
        {/* ── Dark smoky vignette: fades the scene edges into shadow ── */}
        <div aria-hidden style={{
          position:'absolute', inset:0, zIndex:15, pointerEvents:'none',
          boxShadow:'inset 0 0 175px 55px rgba(8,3,0,0.2), inset 0 0 65px 8px rgba(8,3,0,0.55)',
          background:'radial-gradient(ellipse 84% 82% at 50% 42%, rgba(0,0,0,0) 200%, rgba(8,3,0,0.45) 74%, rgba(4,1,0,0.2) 100%)',
        }}/>

        <div style={{position:'absolute',top:-3,left:-3,zIndex:22}}><Corner rot={0}/></div>
        <div style={{position:'absolute',top:-3,right:-3,zIndex:22}}><Corner rot={90}/></div>
        <div style={{position:'absolute',bottom:-3,left:-3,zIndex:22}}><Corner rot={270}/></div>
        <div style={{position:'absolute',bottom:-3,right:-3,zIndex:22}}><Corner rot={180}/></div>

        {/* ── World Map button ── */}
        <button
          onClick={() => navigate('/')}
          style={{
            position:'absolute', top:10, left:12, zIndex:30,
            padding:'6px 14px', borderRadius:20,
            display:'flex', alignItems:'center', gap:5,
            background:'rgba(25,10,2,0.75)',
            border:'1.5px solid rgba(200,152,44,0.7)',
            color:'#F5DC80', cursor:'pointer',
            fontFamily:'Georgia, serif', fontSize:12, letterSpacing:1,
            WebkitTapHighlightColor:'transparent', outline:'none',
            boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          Map
        </button>

        {/* ── Sound toggle ── */}
        <button
          onClick={toggleSound}
          aria-label={playing ? 'Mute music' : 'Play music'}
          style={{
            position:'absolute', top:10, right:12, zIndex:30,
            width:38, height:38, borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(25,10,2,0.75)',
            border:'1.5px solid rgba(200,152,44,0.7)',
            color:'#F5DC80', cursor:'pointer',
            WebkitTapHighlightColor:'transparent', outline:'none',
            boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
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

        <style>{`@keyframes titleSheen {
          0%   { background-position: 230% 0; }
          45%  { background-position: -130% 0; }
          100% { background-position: -130% 0; }
        }`}</style>

        {/* ── Title + map kept together as one vertically-centred group ── */}
        <div ref={areaRef} style={{
          flex:1, width:'100%', minHeight:0,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>

          {/* inner wrapper — translateY shifts content up without affecting scale calc */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0, transform:`translateY(${isMobileLandscape ? '-8%' : '-4%'})` }}>

          {/* Title — metallic logo with a looping shine sweep across the letters */}
          <div ref={titleRef} style={{display:'flex',justifyContent:'center',flexShrink:0,width:'100%',marginTop:80}}>
            <div style={{ position:'relative', width: isMobileLandscape ? 'min(260px,40%)' : 'min(520px,80%)' }}>
              <img src={logoUrl} alt="Espressophia" style={{
                display:'block', width:'100%', height:'auto',
                filter:'contrast(1.08) saturate(1.12) drop-shadow(0 2px 12px rgba(180,130,30,0.6)) drop-shadow(0 1px 4px rgba(0,0,0,0.7))',
              }}/>
              {/* bright band swept across, clipped to the letter shapes via the logo mask */}
              <div aria-hidden style={{
                position:'absolute', inset:0, pointerEvents:'none', mixBlendMode:'screen',
                WebkitMaskImage:`url("${logoUrl}")`, maskImage:`url("${logoUrl}")`,
                WebkitMaskSize:'100% 100%', maskSize:'100% 100%',
                WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat',
                background:'linear-gradient(100deg, transparent 38%, rgba(255,240,200,0.55) 46%, rgba(255,255,255,0.96) 50%, rgba(255,240,200,0.55) 54%, transparent 62%)',
                backgroundSize:'300% 100%',
                animation:'titleSheen 10s ease-in-out infinite',
              }}/>
            </div>
          </div>

          {/* map box sized to the scaled map; inner is natural size scaled from its top-left */}
          <div style={{ width: MAP_W * scale, height: MAP_H * scale, flexShrink:0, position:'relative' }}>
          <div style={{
            position:'absolute', top:0, left:0,
            width: MAP_W,
            height: MAP_H,
            transform:`scale(${scale})`,
            transformOrigin:'top left',
          }}>
            <style>{`
              @keyframes plaqueBob {
                0%,100% { transform: translate(-50%,-50%) translateY(0px); }
                50%     { transform: translate(-50%,-50%) translateY(-5px); }
              }
              .town-plaque { animation: plaqueBob 2.5s ease-in-out infinite; }
              .town-plaque:hover { animation: none; transform: translate(-50%,-50%) scale(1.08); }
              .town-plaque:hover .town-plaque-ring { box-shadow: 0 8px 22px rgba(0,0,0,0.6), 0 0 20px rgba(230,180,40,0.5); }
            `}</style>
            {tiles.map(t => {
              const isHov = hov === t.id
              return (
                <div
                  key={t.id}
                  style={{
                    position:'absolute',
                    left: t.x,
                    top:  t.y,
                    width:  t.dw,
                    height: t.dh,
                    cursor:'pointer',
                    WebkitTapHighlightColor:'transparent',
                    WebkitTouchCallout:'none',
                    userSelect:'none',
                    outline:'none',
                    zIndex: isHov ? 20 : 2,
                    transform: isHov ? 'scale(1.10)' : 'scale(1)',
                    transformOrigin:'center 60%',
                    transition:'transform 0.18s ease, filter 0.18s ease',
                    filter: isHov
                      ? 'drop-shadow(0 0 20px rgba(230,180,40,1)) drop-shadow(0 0 8px rgba(255,200,60,0.8)) brightness(1.1)'
                      : 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))',
                  }}
                  onMouseEnter={() => setHov(t.id)}
                  onMouseLeave={() => setHov(null)}
                  onClick={() => { if (t.id === 'bar') navigate('/Huaroi'); else console.log('click:', t.id) }}
                >
                  <img
                    src={TILE_DIR + t.src}
                    alt={t.name}
                    draggable={false}
                    decoding="async"
                    style={{ width:'100%', height:'100%', display:'block', pointerEvents:'none', userSelect:'none' }}
                  />
                  {t.id === 'bar' && (
                    <div style={{
                      position:'absolute', bottom:'22%', left:'8%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnim sprite={BEARTESTANDING} size={100} />
                    </div>
                  )}
                  {t.id === 'shop' && (
                    <div style={{
                      position:'absolute', bottom:'22%', left:'18%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnim sprite={CATRAMELPOST} size={100} />
                    </div>
                  )}
                  {t.id === 'center' && (
                    <div style={{
                      position:'absolute', bottom:'22%', left:'30%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnim sprite={FOXCAMUSIC} size={100} />
                    </div>
                  )}
                  {t.id === 'workshop' && (
                    <div style={{
                      position:'absolute', bottom:'20%', left:'15%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnim sprite={THAIGERFIX} size={120} />
                    </div>
                  )}
                  {t.id === 'vilage' && (
                    <div style={{
                      position:'absolute', bottom:'12%', left:'30%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnim sprite={PENGURTCAKE} size={100} />
                    </div>
                  )}
                  {t.id === 'cinema' && (
                    <div style={{
                      position:'absolute', bottom:'22%', left:'30%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnim sprite={FLAMINGSHAKEMOVIE} size={120} />
                    </div>
                  )}
                  {t.id === 'temple' && (
                    <div style={{
                      position:'absolute', bottom:'22%', left:'30%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnimPingPong sprite={OLIANGPHANTMAP} size={100} />
                    </div>
                  )}
                  {t.id === 'hotel' && (
                    <div style={{
                      position:'absolute', bottom:'22%', left:'18%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                    }}>
                      <SpriteAnim sprite={WOLFLICANOPOST} size={100} />
                    </div>
                  )}
                  {t.id === 'campus' && (
                    <div style={{
                      position:'absolute', bottom:'22%', left:'30%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      zIndex: 10,
                      transform:'scaleX(-1)',
                    }}>
                      <SpriteAnim sprite={CAPULIONCOFFEE} size={100} />
                    </div>
                  )}
                  {t.id === 'garden' && (
                    <div style={{
                      position:'absolute', bottom:'30%', right:'5%',
                      filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                    }}>
                      <MatchikatreeSprite size={110} />
                    </div>
                  )}

                  {/* Name plaque living inside the Bar tile → /Huaroi dashboard */}
                  {t.id === 'bar' && (
                    <button
                      className="town-plaque"
                      onClick={(e) => { e.stopPropagation(); navigate('/Huaroi') }}
                      aria-label="เปิดแดชบอร์ด Huaroi"
                      style={{
                        position:'absolute', left:'50%', top:'24%',
                        transform:'translate(-50%,-50%)',
                        zIndex:25, cursor:'pointer', border:'none', background:'transparent',
                        padding:0, WebkitTapHighlightColor:'transparent', outline:'none',
                      }}
                    >
                      <span className="town-plaque-ring" style={{
                        display:'block', padding:2, borderRadius:9999,
                        background:'linear-gradient(135deg, #7d5916 0%, #F5DC80 28%, #C8982C 55%, #8a6418 100%)',
                        boxShadow:'0 4px 12px rgba(0,0,0,0.55)', transition:'box-shadow .18s ease',
                      }}>
                        <span style={{
                          display:'block', padding:'4px 18px', borderRadius:9999,
                          background:'linear-gradient(180deg, #3a1c0a 0%, #190a02 100%)',
                          boxShadow:'inset 0 1px 0 rgba(245,220,128,0.25), inset 0 -2px 6px rgba(0,0,0,0.6)',
                        }}>
                          <span style={{
                            fontFamily:'Georgia, "Times New Roman", serif',
                            fontSize:22, fontWeight:700, letterSpacing:2, textTransform:'uppercase',
                            whiteSpace:'nowrap', lineHeight:1.1,
                            backgroundImage:'linear-gradient(180deg, #fff7e0 0%, #F5DC80 32%, #C8982C 62%, #7d5916 100%)',
                            WebkitBackgroundClip:'text', backgroundClip:'text',
                            WebkitTextFillColor:'transparent', color:'transparent',
                            WebkitTextStroke:'0.4px rgba(60,30,5,0.35)',
                            filter:'drop-shadow(0 1px 1px rgba(0,0,0,0.6))',
                          }}>HUAROI</span>
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          </div>

          </div>{/* end inner translateY wrapper */}
        </div>{/* end areaRef */}
      </div>{/* end golden frame */}
    </div>
  )
}
