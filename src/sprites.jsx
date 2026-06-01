import { useState, useRef, useEffect } from 'react'

const BASE    = import.meta.env.BASE_URL || '/'
const IMG_DIR = `${BASE}assets/Espresso/Espresso/`

/* ─── Walking-character sprite sheets ───
   Each entry describes one sheet's grid: `cols`×`rows` cells of `fw`×`fh` px,
   played left→right, row by row. `feet` is the per-frame foot line (px from the
   top of each cell) — the baseline drifts between frames, so we anchor every
   frame to the lowest foot line to keep the character planted (no bobbing). */
export const BEAR = {
  url: `${IMG_DIR}Bearte_Sprite.png`,
  cols: 5, rows: 5, fw: 256, fh: 256, fps: 16,
  feet: [
    218, 223, 233, 234, 233,
    219, 224, 233, 233, 229,
    218, 224, 229, 235, 232,
    219, 223, 232, 233, 229,
    218, 224, 233, 234, 232,
  ],
}
export const WOLF = {
  url: `${IMG_DIR}Wolflicano_Sprite.png`,
  cols: 5, rows: 5, fw: 256, fh: 256, fps: 16,
  feet: [
    218, 217, 227, 242, 243,
    239, 224, 217, 225, 236,
    242, 240, 230, 217, 227,
    241, 243, 238, 219, 220,
    232, 242, 240, 220, 221,
  ],
}
export const FOX = {
  url: `${IMG_DIR}Foxca_Sprite.png`,
  cols: 5, rows: 5, fw: 256, fh: 256, fps: 16,
  feet: [
    218, 223, 235, 234, 234,
    228, 215, 218, 234, 234,
    232, 219, 218, 229, 234,
    234, 233, 223, 215, 220,
    234, 234, 232, 219, 218,
  ],
}
export const CAPULION = {
  url: `${IMG_DIR}Capulion_Sprite.png`,
  cols: 5, rows: 5, fw: 256, fh: 256, fps: 16,
  feet: [
    220, 215, 228, 235, 233,
    225, 212, 227, 235, 235,
    219, 216, 236, 235, 232,
    214, 214, 233, 235, 233,
    216, 215, 235, 232, 220,
  ],
}
export const CAT = {
  url: `${IMG_DIR}Catramel_Sprite.png`,
  cols: 5, rows: 5, fw: 256, fh: 256, fps: 16,
  feet: [
    214, 217, 239, 238, 215,
    217, 239, 237, 214, 217,
    237, 237, 215, 213, 233,
    239, 236, 215, 214, 218,
    223, 237, 238, 215, 214,
  ],
}

export const CAPULIONWIN = {
  url: `${IMG_DIR}Capulionwin.png`,
  cols: 7, rows: 7, fw: 512, fh: 512, fps: 50,
  feet: Array(49).fill(512),
}

export const CATRAMELLOSE = {
  url: `${IMG_DIR}Catramellose.png`,
  cols: 7, rows: 7, fw: 512, fh: 512, fps: 50,
  feet: Array(49).fill(512),
}

export const WOLFLICANOLOSE = {
  url: `${IMG_DIR}Wolflicanolose.png`,
  cols: 5, rows: 5, fw: 512, fh: 512, fps: 25,
  feet: Array(25).fill(512),
}

export const FOXCALOSE = {
  url: `${IMG_DIR}Foxcalose.png`,
  cols: 5, rows: 5, fw: 512, fh: 512, fps: 25,
  feet: Array(25).fill(512),
}

export const BEARTELOSE = {
  url: `${IMG_DIR}Beartelose.png`,
  cols: 5, rows: 5, fw: 512, fh: 512, fps: 25,
  feet: Array(25).fill(512),
}

export const SPRITES = [BEAR, WOLF, FOX, CAPULION, CAT]

/* Opening animation: the whole crew jumps down together (isometric).
   The sheet is a 5×5 grid, but the last frames (14…24) sprout a lion in the
   middle — we stop at `last` so the intro ends on the gathered group. */
export const INTRO = {
  url: `${IMG_DIR}actopen-iso_jump_down-v1.png`,
  cols: 5, rows: 5, fps: 12,
  first: 0, last: 13,
}

/* Advance the animation frame at the sprite's fps (shared by both views). */
export function useSpriteFrame(sprite) {
  const frames = sprite.cols * sprite.rows
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    let raf, last = performance.now(), acc = 0
    const step = (now) => {
      acc += now - last
      last = now
      const interval = 1000 / sprite.fps
      if (acc >= interval) {
        acc %= interval
        setFrame(f => (f + 1) % frames)
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [sprite.fps, frames])
  return frame
}

/* Background style that crops the sheet to one frame and plants the feet.
   `dir` flips horizontally (1 = facing right, -1 = left). */
export function frameStyle(sprite, frame, height, dir) {
  const { cols, rows, fw, fh } = sprite
  const col = frame % cols
  const row = Math.floor(frame / cols)
  const footRef = Math.max(...sprite.feet)
  const footOffset = (footRef - sprite.feet[frame]) * (height / fh)
  return {
    width: height * (fw / fh), height,
    transform: `translateX(-50%) translateY(${footOffset}px) scaleX(${dir})`,
    backgroundImage: `url("${sprite.url}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
    imageRendering: 'auto', pointerEvents: 'none', userSelect: 'none',
  }
}

/* ─── TownRunner: runs along a looping polyline inside the map's own coordinate
   space, so it scales and sits with the town. `points` are [x,y] in the parent's
   pixels; the character's feet are anchored to the point it's currently on.
   `speed` is px/second in that same space; `offset` staggers multiple runners. */
export function TownRunner({ sprite, size = 70, points, speed = 60, offset = 0 }) {
  const frame = useSpriteFrame(sprite)
  const [p, setP] = useState({ x: points[0][0], y: points[0][1], dir: 1 })

  useEffect(() => {
    const segs = points.map((a, i) => {
      const b = points[(i + 1) % points.length]
      const dx = b[0] - a[0], dy = b[1] - a[1]
      return { a, dx, dy, len: Math.hypot(dx, dy) || 0.001 }
    })
    const total = segs.reduce((s, g) => s + g.len, 0)
    let raf, last = performance.now(), dist = offset % total
    const step = (now) => {
      const dt = (now - last) / 1000
      last = now
      dist = (dist + speed * dt) % total
      let d = dist
      for (const g of segs) {
        if (d <= g.len) {
          const t = d / g.len
          setP({ x: g.a[0] + g.dx * t, y: g.a[1] + g.dy * t, dir: g.dx >= 0 ? 1 : -1 })
          break
        }
        d -= g.len
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [points, speed, offset])

  const { cols, rows, fw, fh } = sprite
  const col = frame % cols, row = Math.floor(frame / cols)
  const footRef = Math.max(...sprite.feet)
  const footOffset = (footRef - sprite.feet[frame]) * (size / fh)

  return (
    <div style={{
      position: 'absolute', left: p.x, top: p.y, zIndex: 5,
      width: size * (fw / fh), height: size,
      transform: `translate(-50%, calc(-100% + ${footOffset}px)) scaleX(${p.dir})`,
      backgroundImage: `url("${sprite.url}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
      imageRendering: 'auto', pointerEvents: 'none', userSelect: 'none',
      filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))',
    }}/>
  )
}

/* ─── Walker: paces back and forth, flipping at the edges (Espressopia scene) ─── */
export function SpriteWalker({ sprite, height = 190, speed = 7, startPos = 8, startDir = 1, bottom = '4%' }) {
  const frame          = useSpriteFrame(sprite)
  const [pos, setPos]  = useState(startPos)   // % across the track
  const dirRef         = useRef(startDir)     // 1 = moving right, -1 = left

  useEffect(() => {
    let raf, last = performance.now()
    const step = (now) => {
      const dt = (now - last) / 1000
      last = now
      setPos(p => {
        let next = p + dirRef.current * speed * dt
        if (next > 88) { next = 88; dirRef.current = -1 }
        else if (next < 6) { next = 6; dirRef.current = 1 }
        return next
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [speed])

  return (
    <div style={{
      position: 'absolute', bottom, left: `${pos}%`, zIndex: 25,
      ...frameStyle(sprite, frame, height, dirRef.current),
      filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.55))',
    }}/>
  )
}

/* ─── Jump: loops the crew's jump-down (frames first…last) in place ───
   Sits in the scene like a banner. `size` is any CSS length (the frame is
   square); `bottom`/`left` position it within the nearest positioned parent. */
export function SpriteJump({ size = '60vmin', bottom = '6%', left = '50%', fps = INTRO.fps }) {
  const { url, cols, rows, first, last } = INTRO
  const [frame, setFrame] = useState(first)

  useEffect(() => {
    let raf, lastT = performance.now(), acc = 0, cur = first
    const interval = 1000 / fps
    const step = (now) => {
      acc += now - lastT
      lastT = now
      if (acc >= interval) {
        acc %= interval
        cur = cur >= last ? first : cur + 1
        setFrame(cur)
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [fps])

  const col = frame % cols
  const row = Math.floor(frame / cols)

  return (
    <div style={{
      position: 'absolute', bottom, left, transform: 'translateX(-50%)', zIndex: 25,
      width: size, height: size,
      backgroundImage: `url("${url}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
      imageRendering: 'auto', pointerEvents: 'none', userSelect: 'none',
      filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.55))',
    }}/>
  )
}

/* ─── Lane: runs continuously left→right and wraps around (dashboard scene) ───
   `bottom` (px) lifts the runner off the floor for depth; `opacity` fades the
   ones further back. */
export function SpriteLane({ sprite, height = 30, speed = 22, startPos = 0, bottom = 0, opacity = 1 }) {
  const frame         = useSpriteFrame(sprite)
  const [pos, setPos] = useState(startPos)   // % across the lane

  useEffect(() => {
    let raf, last = performance.now()
    const step = (now) => {
      const dt = (now - last) / 1000
      last = now
      setPos(p => (p + speed * dt > 112 ? -12 : p + speed * dt))
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [speed])

  return (
    <div style={{
      position: 'absolute', bottom, left: `${pos}%`, opacity,
      ...frameStyle(sprite, frame, height, 1),
      filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.55))',
    }}/>
  )
}

/* ─── Marker: runs in place at a fixed % along the lane (rank/progress view) ─── */
export function SpriteMarker({ sprite, height = 100, left = 50, bottom = 0 }) {
  const frame = useSpriteFrame(sprite)
  return (
    <div style={{
      position: 'absolute', bottom, left: `${left}%`,
      ...frameStyle(sprite, frame, height, 1),
      filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.55))',
    }}/>
  )
}
