import { useState, useEffect } from 'react'
import { CAPULIONWIN, CATRAMELLOSE, WOLFLICANOLOSE, FOXCALOSE, BEARTELOSE, useSpriteFrame } from './sprites.jsx'
import { CENTERS } from './centersData.js'

const GREY = '#8a8175'

/* The three usage cards (ranking list · usage gauge · award podium).
   Self-contained: it derives its own ranking + responsive sizing and only
   needs `gaugeScore` (0–100) from the parent (defaults to 60). */
export default function StatsCards({ gaugeScore = 60, compact = false }) {
  const [pulse, setPulse] = useState(true)
  const [deviceSize, setDeviceSize] = useState(typeof window !== 'undefined'
    ? (window.innerWidth >= 1024 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'mobile')
    : 'desktop')
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setDeviceSize(width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile')
      setVw(width)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const needleAngle = (gaugeScore / 100) * 180
  const gaugeColor  = gaugeScore >= 85 ? '#ef4444' : gaugeScore >= 70 ? '#f97316' : gaugeScore >= 40 ? '#f59e0b' : '#10b981'
  const isCritical  = gaugeScore >= 85

  const ranked = [...CENTERS].sort((a, b) => b.count - a.count)
  const maxCount = ranked[0].count

  const isMobile = deviceSize === 'mobile'
  const isTablet = deviceSize === 'tablet'
  const rowH     = isMobile ? 62 : 60
  const coinSize = isMobile ? 50 : isTablet ? 48 : 60
  const iconSize = isMobile ? 54 : isTablet ? 46 : 64

  // compact = slim bottom-bar variant (fixed short cards); else the full-height page layout
  const gridMin  = compact ? '' : 'min-h-[360px] md:min-h-[240px] lg:min-h-[360px]'
  const cardSize = compact ? 'h-[150px]' : 'h-[260px] md:h-0 md:min-h-full'

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 ${gridMin}`}>
      <style>{`@keyframes rankBorderPulse{0%,100%{border-color:#10b981;box-shadow:0 0 4px #10b98144}50%{border-color:#6ee7b7;box-shadow:0 0 20px #10b981ff,0 0 40px #10b981aa}}`}</style>

      {/* COL 1: usage ranking list */}
      <div className={`bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col ${cardSize} overflow-hidden transition-all duration-300 hover:border-[#E6B428]`}>
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <h2 className="text-xs font-bold text-gray-300 tracking-wider">จำนวนครั้งที่ใช้งาน</h2>
          <div className={`w-1.5 h-1.5 rounded-full bg-[#E6B428] ${pulse ? 'animate-pulse' : ''}`} />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          {ranked.map((c, i) => {
            const top = i === 0
            const color = top ? '#10b981' : GREY
            const pct = Math.round((c.count / maxCount) * 100)
            return (
              <div key={c.name} className="flex items-center flex-shrink-0 cursor-default group w-full" style={{ height: rowH }}>
                <div className="flex-shrink-0 flex items-center justify-center select-none relative z-10" style={{ width: coinSize, height: coinSize }}>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="#321609" className="transition-colors duration-300 group-hover:fill-[#3D1E0A]" />
                    <g transform="rotate(-90 50 50)">
                      <circle cx="50" cy="50" r="36" fill="none" stroke={pct > 0 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="0" />
                      <circle cx="50" cy="50" r="36" fill="none" stroke={pct >= 25 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-56.55" />
                      <circle cx="50" cy="50" r="36" fill="none" stroke={pct >= 50 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-113.1" />
                      <circle cx="50" cy="50" r="36" fill="none" stroke={pct >= 75 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-169.65" />
                    </g>
                    <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="26" fontWeight="bold" fontFamily="system-ui,-apple-system,sans-serif">{c.count}</text>
                  </svg>
                </div>
                <div className={`relative overflow-hidden flex-1 flex items-center h-full -ml-7 bg-[#241005] border-t border-b border-r border-solid rounded-r-xl pl-8 transition-all duration-300 group-hover:bg-[#3D1E0A]${top ? ' border-[2px]' : ''}`}
                  style={{
                    borderColor: color,
                    paddingRight: iconSize + 10,
                    ...(top ? { animation: 'rankBorderPulse 1.5s ease-in-out infinite', boxShadow: `0 0 8px ${color}88` } : {}),
                  }}>
                  <img src={c.icon} alt="" aria-hidden className="absolute right-2 top-1/2 -translate-y-1/2 object-contain opacity-90 pointer-events-none select-none" style={{ height: iconSize, width: iconSize }} />
                  <div className="relative z-10 flex flex-col justify-center select-none min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-black flex-shrink-0" style={{ color }}>#{i + 1}</span>
                      <span className="font-bold leading-tight break-words line-clamp-2" style={{ color, fontSize: isMobile ? '8px' : isTablet ? '8px' : '11px', textShadow: `0 0 8px ${color}80` }}>{c.name}</span>
                    </div>
                    <span className="text-[9px] font-semibold tracking-wide mt-0.5" style={{ color: `${color}cc` }}>{c.count.toLocaleString()} ครั้ง</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* COL 2: usage gauge */}
      <div className={`bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col justify-between items-center transition-all duration-300 hover:border-[#E6B428] ${cardSize}`}>
        <div className="flex justify-between items-center mb-3 flex-shrink-0 w-full">
          <h2 className="text-xs font-bold text-gray-300 tracking-wider">ชั่วโมงการใช้งาน</h2>
        </div>

        <div className="relative w-full flex flex-col items-center">
          <svg className="w-full max-w-[180px] sm:max-w-[280px]" viewBox="0 0 200 130">
            <defs>
              <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="needle-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#3A2410" strokeWidth="16" strokeLinecap="round" />
            <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="url(#gauge-grad)" strokeWidth="14" strokeLinecap="round" />
            <line x1="28" y1="102" x2="38" y2="98" stroke="#2A1208" strokeWidth="2" />
            <line x1="43" y1="65" x2="52" y2="65" stroke="#2A1208" strokeWidth="2" />
            <line x1="100" y1="30" x2="100" y2="40" stroke="#2A1208" strokeWidth="2" />
            <line x1="157" y1="65" x2="148" y2="65" stroke="#2A1208" strokeWidth="2" />
            <line x1="172" y1="102" x2="162" y2="98" stroke="#2A1208" strokeWidth="2" />
            <text x="24"  y="124" fill="#9A7B4A" fontSize="9" textAnchor="middle" fontWeight="bold">0</text>
            <text x="57"  y="77"  fill="#9A7B4A" fontSize="9" textAnchor="middle" fontWeight="bold">25</text>
            <text x="100" y="50"  fill="#9A7B4A" fontSize="9" textAnchor="middle" fontWeight="bold">50</text>
            <text x="143" y="77"  fill="#9A7B4A" fontSize="9" textAnchor="middle" fontWeight="bold">75</text>
            <text x="176" y="124" fill="#9A7B4A" fontSize="9" textAnchor="middle" fontWeight="bold">100</text>
            <g transform={`rotate(${needleAngle}, 100, 110)`} filter="url(#needle-glow)">
              <line x1="100" y1="110" x2="22" y2="110" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
              <polygon points="20,110 30,107 30,113" fill="#ffffff" />
            </g>
            <circle cx="100" cy="110" r="7" fill="#2A1208" stroke="#ffffff" strokeWidth="2.5" />
          </svg>
          <p className="text-3xl lg:text-5xl font-black leading-none mt-2 lg:mt-1"
            style={{ color: gaugeColor, textShadow: `0 0 20px ${gaugeColor}b3, 0 0 40px ${gaugeColor}59` }}>{gaugeScore}</p>
          <p className="text-[13px] lg:text-[18px] font-bold tracking-wide lg:tracking-[3px] mt-1.5 lg:mt-0.5" style={{ color: gaugeColor }}>ชั่วโมง</p>
        </div>

        {isCritical && (
          <div className="mt-2">
            <div className="border border-[#ef4444]/60 bg-[#ef4444]/5 text-[#ef4444] text-[10px] font-bold px-4 py-1.5 rounded-md tracking-widest uppercase animate-pulse">
              CRITICAL
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs lg:text-sm text-[rgb(242,228,204)] mt-1.5 lg:-mt-3" />
      </div>

      {/* COL 3: award podium (อันดับ 1–5) */}
      <div className={`bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col overflow-hidden transition-all duration-300 hover:border-[#E6B428] ${cardSize}`} style={{ maxWidth: '100%' }}>
        <div className="flex justify-between items-center mb-3 flex-shrink-0 w-full">
          <h2 className="text-xs font-bold text-gray-300 tracking-wider">Anyone can be Someone</h2>
        </div>
        <div className="flex-1 min-h-0 flex items-end justify-center gap-0 pt-1">
          {[
            { rank: 4, h: 38, hTablet: 38, hMobile: 46 },
            { rank: 2, h: 52, hTablet: 52, hMobile: 60 },
            { rank: 1, h: 70, hTablet: 70, hMobile: 100 },
            { rank: 3, h: 43, hTablet: 43, hMobile: 50 },
            { rank: 5, h: 30, hTablet: 30, hMobile: 38 },
          ].map(({ rank, h, hTablet, hMobile }) => {
            const m = rank === 1 ? ['#FFE894', '#E6B428', '#9a6f12']
                    : rank === 2 ? ['#ECECF0', '#B9BDC6', '#777b83']
                    : rank === 3 ? ['#F2B984', '#CD7F32', '#86491a']
                    :              ['#6b5a44', '#473726', '#2c2216']
            const animSprite = rank === 1 ? CAPULIONWIN : rank === 2 ? WOLFLICANOLOSE : rank === 3 ? CATRAMELLOSE : rank === 4 ? BEARTELOSE : rank === 5 ? FOXCALOSE : null
            const frame = animSprite ? useSpriteFrame(animSprite) : 0
            const mobileChar = Math.max(36, Math.min(54, Math.floor((vw - 88) / 5) - 6))
            const tabletChar = Math.max(36, Math.min(60, Math.floor((vw - 88) / 5) - 4))
            const charSize = deviceSize === 'desktop' ? 90 : deviceSize === 'tablet' ? tabletChar : mobileChar
            const pedestalHeight = deviceSize === 'desktop' ? h : deviceSize === 'tablet' ? hTablet : hMobile
            return (
              <div key={rank} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" style={{ marginRight: deviceSize === 'tablet' ? '-1px' : '0' }}>
                {animSprite ? (
                  <div style={{ position: 'relative', width: charSize, height: charSize, marginBottom: '0px', flexShrink: 0 }}>
                    <div style={{
                      position: 'absolute',
                      width: charSize,
                      height: charSize,
                      backgroundImage: `url("${animSprite.url}")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: `${animSprite.cols * 100}% ${animSprite.rows * 100}%`,
                      backgroundPosition: `${((frame % animSprite.cols) / (animSprite.cols - 1)) * 100}% ${(Math.floor(frame / animSprite.cols) / (animSprite.rows - 1)) * 100}%`,
                      imageRendering: 'pixelated',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }} />
                  </div>
                ) : (
                  <div className='rounded-full flex items-center justify-center font-black text-black mb-1 flex-shrink-0'
                    style={{
                      width: 30, height: 30,
                      fontSize: 14,
                      background: `radial-gradient(circle at 35% 30%, ${m[0]}, ${m[1]} 65%, ${m[2]})`,
                      border: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: `0 0 10px ${m[1]}66, 0 2px 4px rgba(0,0,0,0.5)`,
                    }}>
                    {rank}
                  </div>
                )}

                <div className="w-full rounded-t-md relative"
                  style={{
                    height: `${pedestalHeight}%`,
                    background: `linear-gradient(180deg, ${m[1]} 0%, ${m[2]} 100%)`,
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 0 12px rgba(0,0,0,0.25)',
                    fontSize: deviceSize === 'tablet' ? '12px' : '18px',
                  }}>
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    style={{ fontSize: rank === 1 ? (deviceSize === 'tablet' ? '14px' : '22px') : (deviceSize === 'tablet' ? '10px' : '18px') }}>{rank}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="h-[4px] rounded-full bg-gradient-to-r from-transparent via-[#C8982C]/70 to-transparent flex-shrink-0" />
      </div>

    </div>
  )
}
