import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatsCards from './StatsCards.jsx'
import Marathon from './Marathon.jsx'

const BASE = import.meta.env.BASE_URL || '/'
const MAP_URL = `${BASE}assets/Espresso/Espresso/map.webp`
const CUT_BASE = `${BASE}assets/Espresso/Espresso/VilageCutBG/`
const IMG_DIR = `${BASE}assets/Espresso/Espresso/`
const BGM_URL = `${BASE}assets/Espresso/MorningWalk.m4a`

const MAP_W = 1672, MAP_H = 941

// 5×5 sprite-sheet animations placed in the Bear city
const BEAR_TOWN  = { url: `${IMG_DIR}Bear Citizen-town-v1.png`,  cols: 5, rows: 5, fps: 12 }
const BEAR_SLEEP = { url: `${IMG_DIR}Bear Citizen-sleep-v1.png`, cols: 5, rows: 5, fps: 8 }

// left/top = position on the map as %; size = fraction of map width.
// anchor = fraction of the sprite cell height that touches the ground (1 = cell
// bottom). The sleep sprite is drawn in the upper part of its cell, so its
// ground-contact point sits higher than the cell bottom.
const BEAR_CITIZENS = [
  { sprite: BEAR_TOWN,  left: 41, top: 50, size: 0.05, anchor: 1 },
  { sprite: BEAR_SLEEP, left: 53, top: 51, size: 0.05, anchor: 0.46 },
]

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
      pointerEvents: 'none',
      ...style,
    }} />
  )
}

// native pixel dimensions of each cut image
const VILLAGE_CUTS = {
  center: { url: `${CUT_BASE}Bearvillage.webp`, w: 1415, h: 1111 },
  bar:    { url: `${CUT_BASE}Foxvillage.webp`,  w: 1428, h: 1102 },
  garden: { url: `${CUT_BASE}Catvillage.webp`,  w: 1419, h: 1109 },
  hotel:  { url: `${CUT_BASE}lionvillage.webp`, w: 1405, h: 1119 },
  shop:   { url: `${CUT_BASE}wolfvillage.webp`, w: 1370, h: 1148 },
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
  { id: 'center', name: 'Bear',  left: 47, top: 37, w: 18, h: 26, route: '/catagoly' },
  { id: 'shop',   name: 'Wolf',  left: 27, top: 22, w: 16, h: 22, route: null },
  { id: 'hotel',  name: 'Lion',  left: 70, top: 20, w: 16, h: 22, route: null },
  { id: 'bar',    name: 'Fox',   left: 26, top: 56, w: 16, h: 22, route: null },
  { id: 'garden', name: 'Cat',   left: 73, top: 56, w: 16, h: 22, route: null },
]

/* Per-island tuning for the glowing outline derived from the popup silhouette.
   w = how wide the island spans as a fraction of the map width; dx/dy nudge the
   outline's centre (fractions of map width/height). Adjust these to make each
   stroke sit exactly around its island. The shape itself comes from the popup
   cut image, so it always matches the island's real outline. */
// toggle the glowing island-edge strokes on/off (hover popup still works)
const SHOW_ISLAND_EDGE = false

/* Childcare-centre name shown on each island, matched by its animal (same
   mapping as the dashboard CENTERS). dy nudges the label down from the village
   centre (fraction of map height). */
const ICON_DIR = `${BASE}assets/Espresso/Espresso/Espresso_icon/opt/`
const CENTER_LABELS = {
  shop:   { name: 'ศูนย์พัฒนาเด็กเล็กวัดมหาวนาราม',  icon: 'Wolficano_icon.webp', dx:  0.02, dy: 0.10 }, // Wolf
  hotel:  { name: 'ศูนย์พัฒนาเด็กเล็กเทศบาลหัวรอ 2', icon: 'Capulion_icon.webp',  dx: -0.02, dy: 0.10 }, // Lion
  center: { name: 'ศูนย์พัฒนาเด็กเล็กเทศบาลหัวรอ 1', icon: 'Bearte_icon.webp',    dx:  0.00, dy: 0.12 }, // Bear
  bar:    { name: 'ศูนย์พัฒนาเด็กเล็กสระโคล่ 2',     icon: 'Foxca_icon.webp',     dx:  0.02, dy: 0.11 }, // Fox
  garden: { name: 'ศูนย์พัฒนาเด็กเล็กสระโคล่ 1',     icon: 'Catramel_icon.webp',  dx: -0.02, dy: 0.11 }, // Cat
}

const ISLAND_EDGE = {
  shop:   { w: 0.225, dx:  0.00, dy:  0.020 }, // Wolf  (top-left)
  hotel:  { w: 0.225, dx:  0.00, dy:  0.020 }, // Lion  (top-right)
  center: { w: 0.205, dx: -0.010, dy:  0.075 }, // Bear  (middle)
  bar:    { w: 0.220, dx: -0.008, dy:  0.030 }, // Fox   (bottom-left)
  garden: { w: 0.225, dx:  0.012, dy:  0.040 }, // Cat   (bottom-right)
}

export default function WorldMap() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [playing, setPlaying] = useState(false)
  const containerRef = useRef(null)
  const audioRef = useRef(null)
  const dashRef = useRef(null)
  const scrollRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 750 })
  // true once the page has scrolled down to the dashboard (toggles the guide button)
  const [scrolled, setScrolled] = useState(false)
  // live tuning of the island-edge strokes — open with ?tune=1, drag with arrow keys
  const [edge, setEdge] = useState(ISLAND_EDGE)
  const [tuning] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tune'))
  const [tuneSel, setTuneSel] = useState('center')
  // drag-to-pan offset (used when the map is larger than the viewport, e.g. portrait)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, moved: false })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Live tuning (only when ?tune=1): pick an island with keys 1–5, then nudge
     with arrow keys (position) and -/= (size). Values are shown on screen and
     logged so they can be pasted back into ISLAND_EDGE. */
  useEffect(() => {
    if (!tuning) return
    const ids = ['shop', 'hotel', 'center', 'bar', 'garden']
    const onKey = (e) => {
      if (e.key >= '1' && e.key <= '5') { setTuneSel(ids[+e.key - 1]); return }
      const stepP = e.shiftKey ? 0.001 : 0.005
      const stepW = e.shiftKey ? 0.002 : 0.01
      let handled = true
      setEdge(prev => {
        const cur = { ...prev[tuneSel] }
        if (e.key === 'ArrowLeft')  cur.dx = +(cur.dx - stepP).toFixed(4)
        else if (e.key === 'ArrowRight') cur.dx = +(cur.dx + stepP).toFixed(4)
        else if (e.key === 'ArrowUp')    cur.dy = +(cur.dy - stepP).toFixed(4)
        else if (e.key === 'ArrowDown')  cur.dy = +(cur.dy + stepP).toFixed(4)
        else if (e.key === '-' || e.key === '_') cur.w = +(cur.w - stepW).toFixed(4)
        else if (e.key === '=' || e.key === '+') cur.w = +(cur.w + stepW).toFixed(4)
        else { handled = false; return prev }
        const next = { ...prev, [tuneSel]: cur }
        // eslint-disable-next-line no-console
        console.log('ISLAND_EDGE', JSON.stringify(next, null, 2))
        return next
      })
      if (handled) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tuning, tuneSel])

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
  const mapW = MAP_W * mapScale, mapH = MAP_H * mapScale
  const baseLeft = (containerSize.w - mapW) / 2
  const baseTop  = (containerSize.h - mapH) / 2

  // when the map overflows the viewport (portrait), allow dragging to pan around it
  const pannableX = mapW > containerSize.w + 1
  const pannableY = mapH > containerSize.h + 1
  const minPanX = baseLeft, maxPanX = -baseLeft  // baseLeft is ≤ 0 when overflowing
  const minPanY = baseTop,  maxPanY = -baseTop
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  // effective top-left of the map after panning (clamped so edges never pull inside)
  const mapLeft = pannableX ? baseLeft + clamp(pan.x, minPanX, maxPanX) : baseLeft
  const mapTop  = pannableY ? baseTop  + clamp(pan.y, minPanY, maxPanY) : baseTop

  const onPanDown = (e) => {
    if (!pannableX && !pannableY) return
    // อย่าเพิ่ง setPointerCapture ที่นี่ — มันจะ "ดูด" click ของลูก (popup/label) ไปที่ map
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false }
  }
  const onPanMove = (e) => {
    const d = drag.current
    if (!d.active) return
    const dx = e.clientX - d.lastX, dy = e.clientY - d.lastY
    d.lastX = e.clientX; d.lastY = e.clientY
    if (Math.abs(e.clientX - d.startX) > 6 || Math.abs(e.clientY - d.startY) > 6) {
      // เริ่มลากจริงแล้วค่อยจับ pointer (เพื่อให้ pan ลื่นแม้เมาส์ออกนอกกรอบ)
      if (!d.moved) e.currentTarget.setPointerCapture?.(e.pointerId)
      d.moved = true
    }
    setPan(p => ({
      x: pannableX ? clamp(p.x + dx, minPanX, maxPanX) : 0,
      y: pannableY ? clamp(p.y + dy, minPanY, maxPanY) : 0,
    }))
  }
  const onPanUp = (e) => {
    drag.current.active = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  // a village is "active" when clicked (locked) or hovered — both show its popup
  const active = selected || hovered

  return (
    <div ref={scrollRef} className="wm-scroll"
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 80)}
      style={{
        position: 'relative', width: '100%', height: '100%',
        overflowY: 'auto', overflowX: 'hidden',
        backgroundColor: '#2D1008',
      }}>
      <style>{`
        @keyframes frameGlow {
          0%,100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 0 14px rgba(230,180,40,0.18), inset 0 0 14px rgba(230,180,40,0.08); }
          50%     { box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 0 30px rgba(245,220,128,0.40), inset 0 0 22px rgba(245,220,128,0.16); }
        }
        @keyframes scrollHintBounce {
          0%,100% { transform: translateY(0); opacity: 0.85; }
          50%     { transform: translateY(7px); opacity: 1; }
        }
        @keyframes scrollHintBounceUp {
          0%,100% { transform: translateY(0); opacity: 0.85; }
          50%     { transform: translateY(-7px); opacity: 1; }
        }
        .wm-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .wm-scroll::-webkit-scrollbar { display: none; }
        @keyframes islandEdge {
          0%,100% { opacity: 0.55; }
          50%     { opacity: 1; }
        }
        @keyframes labelPulse {
          0%,100% { transform: scale(1);    filter: drop-shadow(0 3px 7px rgba(0,0,0,0.65)); }
          50%     { transform: scale(1.045); filter: drop-shadow(0 3px 9px rgba(0,0,0,0.65)) drop-shadow(0 0 9px rgba(245,220,128,0.6)); }
        }
        @keyframes labelFloat {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes pinBlink {
          0%,100% { box-shadow: 0 0 6px rgba(245,220,128,0.7), 0 2px 4px rgba(0,0,0,0.5); }
          50%     { box-shadow: 0 0 14px rgba(245,220,128,1), 0 0 22px rgba(245,220,128,0.6), 0 2px 4px rgba(0,0,0,0.5); }
        }
      `}</style>

      <div style={{
        position: 'relative', zIndex: 5,
        width: '100%', height: '100%',
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


        <img
          src={`${IMG_DIR}ESPRESSOPHIA.png`}
          alt="Esprestopia"
          style={{
            position: 'absolute', top: 'clamp(8px, 3.5vh, 40px)', left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, pointerEvents: 'none',
            // scale by the smaller viewport axis so it stays proportional in
            // landscape (short) phones, and cap width so it never overflows
            height: 'clamp(30px, 9vmin, 64px)', width: 'auto', maxWidth: '72vw',
            objectFit: 'contain',
          }}
        />

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
          onClick={() => { if (!drag.current.moved) { setSelected(null); setHovered(null) } }}
          onPointerDown={onPanDown}
          onPointerMove={onPanMove}
          onPointerUp={onPanUp}
          onPointerCancel={onPanUp}
          style={{
            position: 'absolute', inset: 0,
            touchAction: (pannableX || pannableY) ? 'none' : 'auto',
            cursor: (pannableX || pannableY) ? 'grab' : 'default',
          }}
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

          {/* Animated Bear citizens living in the Bear city */}
          {BEAR_CITIZENS.map((c, i) => {
            const size = c.size * MAP_W * mapScale
            const sx = mapLeft + (c.left / 100) * MAP_W * mapScale
            const sy = mapTop  + (c.top  / 100) * MAP_H * mapScale
            // grey out together with the map when another village is active
            const dim = active && active !== 'center'
            return (
              <div key={i} style={{
                position: 'absolute',
                left: sx - size / 2,
                top:  sy - size * (c.anchor ?? 1),  // anchor by the ground-contact point
                zIndex: 2,
                filter: dim ? 'grayscale(1) brightness(0.55)' : 'none',
                transition: 'filter 0.4s ease',
                pointerEvents: 'none',
              }}>
                <SpriteAnim sprite={c.sprite} size={size} />
              </div>
            )
          })}

          {/* Always-on glowing stroke around each island — the popup cut image's
              silhouette with its inner area masked out (full shape XOR a slightly
              smaller copy = just the outline). Sized/placed per island via
              ISLAND_EDGE so it sits right around the island. No image fill. */}
          {SHOW_ISLAND_EDGE && Object.entries(VILLAGE_CUTS).map(([vid, cut]) => {
            const v = VILLAGES.find(x => x.id === vid)
            const tune = edge[vid] || { w: 0.24, dx: 0, dy: 0 }
            const on = active === vid
            const dim = active && !on
            // village centre on the map
            const cx = mapLeft + (v.left / 100) * MAP_W * mapScale
            const cy = mapTop  + (v.top  / 100) * MAP_H * mapScale
            // idle geometry (small, around the island) vs expanded = popup geometry
            const iw = tune.w * MAP_W * mapScale, ih = iw * (cut.h / cut.w)
            const fit = Math.min(containerSize.w / cut.w, containerSize.h / cut.h) * POPUP_SCALE
            const pw = cut.w * fit, ph = cut.h * fit
            const W = on ? pw : iw
            const H = on ? ph : ih
            const L = on ? (cx - pw / 2) : (cx + tune.dx * MAP_W * mapScale - iw / 2)
            const T = on ? (cy - ph / 2 + ph * POPUP_SHIFT_Y) : (cy + tune.dy * MAP_H * mapScale - ih / 2)
            const masks = `url("${cut.url}"), url("${cut.url}")`
            // constant stroke thickness in px (so it stays thin even when expanded)
            const t = 5
            const innerW = Math.max(0, W - 2 * t), innerH = Math.max(0, H - 2 * t)
            return (
              <div key={`edge-${vid}`} aria-hidden style={{
                position: 'absolute',
                left: L, top: T, width: W, height: H,
                WebkitMaskImage: masks, maskImage: masks,
                WebkitMaskRepeat: 'no-repeat, no-repeat', maskRepeat: 'no-repeat, no-repeat',
                WebkitMaskPosition: 'center, center', maskPosition: 'center, center',
                WebkitMaskSize: `100% 100%, ${innerW}px ${innerH}px`, maskSize: `100% 100%, ${innerW}px ${innerH}px`,
                WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                backgroundColor: (tuning && tuneSel === vid) ? 'rgba(120,230,140,0.98)' : 'rgba(245,220,128,0.95)',
                filter: 'blur(0.5px) drop-shadow(0 0 5px rgba(245,220,128,0.9)) drop-shadow(0 0 13px rgba(245,220,128,0.55))',
                opacity: tuning ? 1 : (dim ? 0.14 : 1),
                animation: (on || dim) ? 'none' : 'islandEdge 2.6s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 5,
                transition: 'opacity 0.35s ease, left 0.35s ease, top 0.35s ease, width 0.35s ease, height 0.35s ease',
              }} />
            )
          })}

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
              <div
                key={vid}
                onMouseEnter={() => setHovered(vid)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  if (drag.current.moved) return
                  if (v.route) navigate(v.route)            // เกาะที่มีปลายทาง → กดที่ popup เข้าได้เลย
                  else { setSelected(null); setHovered(null) }  // เกาะอื่น → คลิกเพื่อปิด popup
                }}
                style={{
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
                // รับคลิก/hover เฉพาะตอนแสดงอยู่ (ไม่งั้นบังการคลิกแผนที่)
                pointerEvents: on ? 'auto' : 'none',
                cursor: 'pointer',
                // gold glow comes from the edge-stroke layer above; just a soft drop shadow here
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
                  if (drag.current.moved) return  // this was a pan, not a tap
                  if (tuning) { setTuneSel(v.id); return }
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

          {/* Centre name labels on each island — clickable + gently pulsing so
              players know they can tap them (pan/zoom with the map) */}
          {VILLAGES.map(v => {
            const lab = CENTER_LABELS[v.id]
            if (!lab) return null
            const cx = mapLeft + ((v.left / 100) + (lab.dx || 0)) * MAP_W * mapScale
            const cy = mapTop  + ((v.top / 100) + lab.dy) * MAP_H * mapScale
            const on = active === v.id
            const dim = active && !on
            const fs = Math.max(11, 0.0105 * MAP_W * mapScale)
            return (
              <div key={`label-${v.id}`}
                onClick={e => {
                  e.stopPropagation()
                  if (drag.current.moved) return
                  if (selected === v.id) { if (v.route) navigate(v.route); else setSelected(null) }
                  else setSelected(v.id)
                }}
                onMouseEnter={() => { if (hovered !== v.id) hoverBlip(); setHovered(v.id) }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: cx, top: cy, transform: 'translate(-50%,-50%)',
                  zIndex: 6, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  opacity: on ? 0 : (dim ? 0.3 : 1),
                  transition: 'opacity 0.35s ease',
                }}>
                {(() => {
                  const med = Math.round(fs * 3.0)   // medallion diameter
                  const ring = Math.max(2, Math.round(fs * 0.2))
                  return (
                    <div style={{
                      position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                      animation: (on || dim) ? 'none' : 'labelFloat 2.2s ease-in-out infinite',
                    }}>
                      {/* medallion + plaque row */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        animation: (on || dim) ? 'none' : 'labelPulse 2.4s ease-in-out infinite',
                      }}>
                        {/* round gold medallion with the animal icon */}
                        <div style={{
                          width: med, height: med, borderRadius: '50%', flexShrink: 0, zIndex: 2,
                          background: 'radial-gradient(circle at 50% 38%, #3a2410 0%, #190c04 100%)',
                          border: `${ring}px solid #C8982C`,
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.6), inset 0 1px 3px rgba(245,220,128,0.45), 0 3px 9px rgba(0,0,0,0.65)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        }}>
                          {lab.icon && (
                            <img src={`${ICON_DIR}${lab.icon}`} alt="" aria-hidden style={{
                              width: '78%', height: '78%', objectFit: 'contain',
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                            }} />
                          )}
                        </div>
                        {/* name plaque, tucked under the medallion's right edge */}
                        <div style={{
                          marginLeft: -Math.round(med * 0.34),
                          paddingLeft: Math.round(med * 0.42),
                          paddingRight: Math.round(fs * 1),
                          paddingTop: Math.round(fs * 0.34), paddingBottom: Math.round(fs * 0.34),
                          whiteSpace: 'nowrap',
                          fontFamily: 'Georgia, "Sarabun", serif', fontWeight: 700,
                          fontSize: fs, lineHeight: 1.1, letterSpacing: 0.5, color: '#FBE8C2',
                          background: 'linear-gradient(180deg, #4a2e12 0%, #2c1708 55%, #190c04 100%)',
                          border: '1.5px solid #C8982C', borderRadius: Math.round(fs * 0.4),
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.55), inset 0 1px 0 rgba(245,220,128,0.3), inset 0 -2px 5px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.55)',
                          textShadow: '0 1px 1px rgba(0,0,0,0.95), 0 0 6px rgba(230,180,40,0.3)',
                        }}>
                          {lab.name}
                        </div>
                      </div>
                      {/* gold pin pointing down at the location */}
                      <div aria-hidden style={{ width: 2, height: Math.round(fs * 1.1), background: 'linear-gradient(#E6B428, #7d5916)' }} />
                      <div aria-hidden style={{
                        width: Math.round(fs * 0.6), height: Math.round(fs * 0.6), borderRadius: '50%', marginTop: -1,
                        background: 'radial-gradient(circle at 35% 30%, #FBE8C2, #E6B428 55%, #7d5916)',
                        boxShadow: '0 0 7px rgba(245,220,128,0.8), 0 2px 4px rgba(0,0,0,0.5)',
                        animation: (on || dim) ? 'none' : 'pinBlink 1.6s ease-in-out infinite',
                      }} />
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* Vignette */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
          boxShadow: 'inset 0 0 140px 50px rgba(8,3,0,0.7)',
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(4,1,0,0.25) 100%)',
        }} />

        {/* Live tuning panel (only with ?tune=1) */}
        {tuning && (
          <div style={{
            position: 'fixed', top: 12, left: 12, zIndex: 100,
            background: 'rgba(10,4,1,0.92)', border: '1px solid #C8982C', borderRadius: 10,
            padding: '10px 12px', color: '#F5DC80', font: '12px/1.5 monospace', maxWidth: 320,
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#fff' }}>🛠 ปรับเส้นเกาะ (?tune)</div>
            <div style={{ opacity: 0.85, marginBottom: 8 }}>
              เลือกเกาะ: กด 1–5 หรือคลิกที่เกาะ · ลูกศร = ขยับ · −/= = ย่อ/ขยาย · กด Shift = ละเอียดขึ้น
            </div>
            {['shop','hotel','center','bar','garden'].map((id, i) => {
              const e2 = edge[id]
              const names = { shop:'หมาป่า', hotel:'สิงโต', center:'หมี', bar:'จิ้งจอก', garden:'แมว' }
              const seld = tuneSel === id
              return (
                <div key={id} onClick={() => setTuneSel(id)} style={{
                  cursor: 'pointer', padding: '2px 6px', borderRadius: 5,
                  background: seld ? 'rgba(120,230,140,0.18)' : 'transparent',
                  color: seld ? '#9be8a8' : '#F5DC80',
                }}>
                  {i + 1}. {names[id]}: {`{ w: ${e2.w}, dx: ${e2.dx}, dy: ${e2.dy} }`}
                </div>
              )
            })}
          </div>
        )}

        {/* Scroll-down guide — hints that the usage dashboard sits below the map */}
        <button
          onClick={() => dashRef.current?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="เลื่อนลงดูสถิติการใช้งาน"
          style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: '#F5DC80', WebkitTapHighlightColor: 'transparent', outline: 'none',
            textShadow: '0 1px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)',
            filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: 'Georgia, serif' }}>
            เลื่อนลงดูสถิติการใช้งาน
          </span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'scrollHintBounce 1.6s ease-in-out infinite' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Usage dashboard section — revealed by scrolling down */}
      <section ref={dashRef} style={{ padding: '24px 12px 40px' }}>
        <div style={{ maxWidth: 1700, margin: '0 auto' }}>
          <div className="bg-[#2A1208] rounded-2xl border-2 border-solid border-[#C8982C] p-4 sm:p-6 shadow-[0_0_32px_rgba(200,152,44,0.35)]">
            <h2 className="text-base font-extrabold tracking-wider text-white mb-4">เทศบาลตำบลหัวรอ · สถิติการใช้งาน</h2>
            <div className="mb-6">
              <StatsCards gaugeScore={60} />
            </div>
            <Marathon />
          </div>
        </div>
      </section>

      {/* Back-to-map guide — pinned top-center, mirrors the scroll-down button */}
      <button
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="เลื่อนขึ้นกลับแผนที่"
        style={{
          position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: '#F5DC80', WebkitTapHighlightColor: 'transparent', outline: 'none',
          textShadow: '0 1px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)',
          filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))',
          opacity: scrolled ? 1 : 0, pointerEvents: scrolled ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'scrollHintBounceUp 1.6s ease-in-out infinite' }}>
          <polyline points="6 15 12 9 18 15" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: 'Georgia, serif' }}>
          กลับขึ้นแผนที่
        </span>
      </button>
    </div>
  )
}
