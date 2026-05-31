import { useState, useRef, useLayoutEffect } from 'react'

const BASE    = import.meta.env.BASE_URL || '/'
const BG_URL  = `${BASE}assets/Espresso/Espresso/BG.png`
const IMG_DIR = `${BASE}assets/Espresso/Espresso/`
const BGM_URL = `${BASE}assets/Espresso/MorningWalk.m4a`

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

export default function Espressopia() {
  const [hov, setHov] = useState(null)
  const fitRef = useRef(null)
  const [scale, setScale] = useState(1)
  const logoUrl = `${BASE}assets/Espresso/Espresso/ESPRESSOPHIA.png`

  /* scale the map to fit the available area (keeps aspect ratio, no clipping) */
  useLayoutEffect(() => {
    const el = fitRef.current
    if (!el) return
    const fit = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width && height) setScale(Math.min(width / MAP_W, height / MAP_H, 1))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* looping background music — browsers block autoplay-with-sound, so fall back
     to starting on the first user interaction */
  useLayoutEffect(() => {
    const audio = new Audio(BGM_URL)
    audio.loop = true
    audio.volume = 0.4
    audio.play().catch(() => {
      const start = () => { audio.play(); cleanup() }
      const cleanup = () => {
        window.removeEventListener('pointerdown', start)
        window.removeEventListener('keydown', start)
        window.removeEventListener('touchstart', start)
      }
      window.addEventListener('pointerdown', start)
      window.addEventListener('keydown', start)
      window.addEventListener('touchstart', start)
    })
    return () => { audio.pause(); audio.src = '' }
  }, [])

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

      {/* ── Golden frame ── */}
      <div style={{
        position:'relative', zIndex:5,
        width:'calc(100% - 28px)', height:'calc(100% - 20px)', maxWidth:1400,
        border:'1.5px solid rgba(200,152,44,0.6)', boxSizing:'border-box',
        display:'flex', flexDirection:'column', alignItems:'center',
        padding:'4px 8px 8px',
      }}>
        <div style={{position:'absolute',top:-3,left:-3}}><Corner rot={0}/></div>
        <div style={{position:'absolute',top:-3,right:-3}}><Corner rot={90}/></div>
        <div style={{position:'absolute',bottom:-3,left:-3}}><Corner rot={270}/></div>
        <div style={{position:'absolute',bottom:-3,right:-3}}><Corner rot={180}/></div>

        {/* Title */}
        <div style={{display:'flex',justifyContent:'center',flexShrink:0,paddingTop:4,paddingBottom:4}}>
          <img src={logoUrl} alt="Espressophia" style={{
            width:'min(520px,80%)', height:'auto',
            filter:'drop-shadow(0 2px 12px rgba(180,130,30,0.6)) drop-shadow(0 1px 4px rgba(0,0,0,0.7))',
          }}/>
        </div>

        {/* ── Hex map wrapper (centres and scales map to fit) ── */}
        <div ref={fitRef} style={{
          flex:1, width:'100%', minHeight:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          overflow:'hidden',
        }}>
          {/* inner: natural-size map, scaled down to fit while keeping aspect ratio */}
          <div style={{
            position:'relative',
            width: MAP_W,
            height: MAP_H,
            flexShrink:0,
            transform:`scale(${scale})`,
            transformOrigin:'center center',
          }}>
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
                  onClick={() => console.log('click:', t.id)}
                >
                  <img
                    src={IMG_DIR + t.src}
                    alt={t.name}
                    draggable={false}
                    style={{ width:'100%', height:'100%', display:'block', pointerEvents:'none', userSelect:'none' }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
