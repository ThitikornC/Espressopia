import { useState, useEffect } from 'react'
import { SpriteMarker } from './sprites.jsx'
import { CENTERS } from './centersData.js'

const BASE = import.meta.env.BASE_URL || '/'
/* Each runner gets its own scene strip (defaults to the shared RunBG for now). */
const RUN_SCENE = `${BASE}assets/Espresso/Espresso/opt/RunBG_full.jpg`
/* Vertical crop of the scene inside each lane: 100% = ground at the very
   bottom · lower numbers reveal more of the upper scene. */
const SCENE_POS = 'center 90%'
const CUP_URL   = `${BASE}assets/Espresso/Espresso/opt/CUP.webp`

/* The coffee-town street where every centre's character runs together — each
   lane's runner sits at a position proportional to its usage (#1 leads). */
export default function Marathon() {
  const [deviceSize, setDeviceSize] = useState(typeof window !== 'undefined'
    ? (window.innerWidth >= 1024 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'mobile')
    : 'desktop')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setDeviceSize(width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile')
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const ranked = [...CENTERS].sort((a, b) => b.count - a.count)
  const maxCount = ranked[0].count

  const isMobile = deviceSize === 'mobile'
  const isTablet = deviceSize === 'tablet'
  const laneH   = isMobile ? 80 : isTablet ? 90 : 110
  const cupH    = isMobile ? 60 : isTablet ? 68 : 84
  const spriteH = isMobile ? 86 : isTablet ? 96 : 115

  return (
    <div className="border-2 border-solid border-[#B5851F] rounded-xl pt-3 pb-3 px-3 flex-shrink-0">
      <style>{`@keyframes cupFloat{0%,100%{transform:translateY(0px) scale(1);filter:drop-shadow(0 4px 12px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(230,180,40,0.5))}50%{transform:translateY(-6px) scale(1.04);filter:drop-shadow(0 8px 16px rgba(0,0,0,0.5)) drop-shadow(0 0 18px rgba(230,180,40,1)) drop-shadow(0 0 30px rgba(230,180,40,0.6))}}`}</style>
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#C8982C]/40" />
        <h3 className="text-[9px] lg:text-xs font-bold text-[#C8982C] tracking-[0.15em] lg:tracking-[0.25em] uppercase text-center flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#C8982C] animate-pulse" />
          ESPRESSOPHIA · Marathon
        </h3>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#C8982C]/40" />
      </div>

      {/* lanes ordered by the ranking — #1 runs out in front */}
      <div className="flex flex-col gap-2">
        {ranked.map((c) => (
          <div key={c.name} className="relative rounded-lg overflow-hidden border border-[#4A2A10]"
            style={{
              height: laneH,
              backgroundImage: `url("${RUN_SCENE}")`,
              backgroundSize: 'cover',
              backgroundPosition: SCENE_POS,
              backgroundRepeat: 'no-repeat',
            }}>
            {/* trophy at the finish line (right end) */}
            <img src={CUP_URL} alt="" aria-hidden
              className="absolute bottom-1 w-auto pointer-events-none select-none z-10"
              style={{
                height: cupH,
                right: isMobile ? 4 : 8,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6)) drop-shadow(0 0 10px rgba(230,180,40,0.7))',
                animation: 'cupFloat 2.4s ease-in-out infinite',
                transformOrigin: 'bottom center',
              }} />
            {/* run in place at a position = usage relative to #1 (#1 = end of lane) */}
            <SpriteMarker sprite={c.sprite} height={spriteH} bottom={6}
              left={Math.max(5, (c.count / maxCount) * (isMobile ? 55 : 80))} />
          </div>
        ))}
      </div>
    </div>
  )
}
