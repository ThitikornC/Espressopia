import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE     = import.meta.env.BASE_URL || '/'
const IMG_DIR  = `${BASE}assets/Espresso/Espresso/`
const TILE_DIR = `${IMG_DIR}opt/`                 // downscaled tiles (small files)
const BG_URL   = `${TILE_DIR}BG.png`
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
  { id:'bar',      src:'bar.png',      name:'Bar',      iw:4309, ih:4530, bx:2238, by:4530, cx: 0.0, ry: 0 },
  { id:'temple',   src:'temple.png',   name:'Temple',   iw:4562, ih:5161, bx:2274, by:5161, cx: 1.0, ry: 0 },
  { id:'garden',   src:'garden.png',   name:'Garden',   iw:4489, ih:4575, bx:2278, by:4575, cx: 2.0, ry: 0 },
  { id:'hotel',    src:'Hotel.png',    name:'Hotel',    iw:4319, ih:4685, bx:2210, by:4685, cx: 3.0, ry: 0 },
  /* ── Row 1 (3 tiles, offset +0.5) ── */
  { id:'shop',     src:'shop.png',     name:'Shop',     iw:4467, ih:4700, bx:2238, by:4700, cx: 0.5, ry: 1 },
  { id:'center',   src:'Center.png',   name:'Center',   iw:4314, ih:4822, bx:2150, by:4822, cx: 1.5, ry: 1 },
  { id:'vilage',   src:'vilage.png',   name:'Village',  iw:4535, ih:4307, bx:2272, by:4307, cx: 2.5, ry: 1 },
  /* ── Row 2 (2 tiles, offset +1.0) ── */
  { id:'workshop', src:'workshop.png', name:'Workshop', iw:4300, ih:5038, bx:2174, by:5038, cx: 1.0, ry: 2 },
  { id:'campus',   src:'campus.png',   name:'Campus',   iw:4618, ih:5244, bx:2398, by:5244, cx: 2.0, ry: 2 },
  /* ── Row 3 (1 tile, bottom point, offset +1.5) ── */
  { id:'cinema',   src:'cinrma.png',   name:'Cinema',   iw:5020, ih:4912, bx:2534, by:4912, cx: 1.5, ry: 3 },
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

export default function Espressopia() {
  const [hov, setHov] = useState(null)
  const areaRef = useRef(null)
  const titleRef = useRef(null)
  const [scale, setScale] = useState(1)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const navigate = useNavigate()
  const logoUrl = `${BASE}assets/Espresso/Espresso/ESPRESSOPHIA.png`

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
      position:'relative', width:'100vw', height:'100vh', overflow:'hidden',
      backgroundColor:'#2D1008',
      backgroundImage:[
        'radial-gradient(ellipse 100% 55% at 50% 0%,   rgba(80,30,4,0.45)  0%,transparent 60%)',
        'radial-gradient(ellipse 40% 100% at 0%   50%, rgba(10,2,0,0.45)   0%,transparent 55%)',
        'radial-gradient(ellipse 40% 100% at 100% 50%, rgba(10,2,0,0.45)   0%,transparent 55%)',
        'radial-gradient(ellipse 100% 55% at 50% 100%, rgba(6,1,0,0.55)    0%,transparent 60%)',
        `url("${BG_URL}")`,
      ].join(', '),
      backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>

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
          gap:8, overflow:'hidden',
        }}>

          {/* Title — metallic logo with a looping shine sweep across the letters */}
          <div ref={titleRef} style={{display:'flex',justifyContent:'center',flexShrink:0,width:'100%'}}>
            <div style={{ position:'relative', width:'min(520px,80%)' }}>
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
              .town-plaque { transition: transform .18s ease; }
              .town-plaque:hover { transform: translate(-50%,-50%) scale(1.06); }
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
        </div>
      </div>
    </div>
  )
}
