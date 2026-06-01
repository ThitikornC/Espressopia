import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, ArrowUpRight } from 'lucide-react';
import { BEAR, WOLF, FOX, CAPULION, CAT, CAPULIONWIN, CATRAMELLOSE, WOLFLICANOLOSE, FOXCALOSE, BEARTELOSE, SpriteMarker, useSpriteFrame } from './sprites.jsx';

/* Same parchment map + warm vignette backdrop as the Espressopia landing page */
const BASE   = import.meta.env.BASE_URL || '/'
const BG_URL = `${BASE}assets/Espresso/Espresso/opt/BG.jpg`
const PAGE_BG = {
  backgroundColor: '#2D1008',
  backgroundImage: [
    'radial-gradient(ellipse 100% 55% at 50% 0%,   rgba(80,30,4,0.45) 0%,transparent 60%)',
    'radial-gradient(ellipse 40% 100% at 0%   50%, rgba(10,2,0,0.55)  0%,transparent 55%)',
    'radial-gradient(ellipse 40% 100% at 100% 50%, rgba(10,2,0,0.55)  0%,transparent 55%)',
    'radial-gradient(ellipse 100% 55% at 50% 100%, rgba(6,1,0,0.6)    0%,transparent 60%)',
    `url("${BG_URL}")`,
  ].join(', '),
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}

/* Each runner gets its own scene strip — swap `scene` per character to give
   them different backdrops (defaults to the shared RunBG for now). */
const RUN_SCENE = `${BASE}assets/Espresso/Espresso/opt/RunBG_full.jpg`
/* Vertical crop position of the scene inside each lane:
   100% = ground at the very bottom · lower numbers reveal more of the upper
   scene (wall → buildings → sky). Tweak this one value to reframe all lanes. */
const SCENE_POS = 'center 90%'
const CUP_URL   = `${BASE}assets/Espresso/Espresso/opt/CUP.png`   // trophy at each finish line

const ICON_DIR = `${BASE}assets/Espresso/Espresso/Espresso_icon/opt/`
const GREY = '#8a8175'

/* The five centres. `count` = how many times each was used; both the camera
   list and the running lanes are ranked by it (most-used first), and each
   centre owns one character (sprite for the run, coin icon for the list). */
const CENTERS = [
  { name: 'ศูนย์พัฒนาเด็กเล็กเทศบาลหัวรอ 1', count: 124, sprite: BEAR,     icon: `${ICON_DIR}Bearte_icon.png` },
  { name: 'ศูนย์พัฒนาเด็กเล็กเทศบาลหัวรอ 2', count: 201, sprite: CAPULION, icon: `${ICON_DIR}Capulion_icon.png` },
  { name: 'ศูนย์พัฒนาเด็กเล็กสระโคล่ 1',     count: 156, sprite: CAT,      icon: `${ICON_DIR}Catramel_icon.png` },
  { name: 'ศูนย์พัฒนาเด็กเล็กสระโคล่ 2',     count: 98,  sprite: FOX,      icon: `${ICON_DIR}Foxca_icon.png` },
  { name: 'ศูนย์พัฒนาเด็กเล็กวัดมหาวนาราม',  count: 172, sprite: WOLF,     icon: `${ICON_DIR}Wolficano_icon.png` },
]

/* ── Floor2 plan constants ──────────────────────────────────────────────── */
const FLOOR2_KEY = 'floor2_zones'
const PREVIEW_CAM1_KEY = 'preview_cam1_id'
const CAM1_CAPACITY = 50

function camColor(pct) {
  if (pct >= 85) return '#ef4444'
  if (pct >= 70) return '#f97316'
  if (pct >= 40) return '#f59e0b'
  return '#10b981'
}
function camLabel(pct) {
  if (pct >= 85) return 'หนาแน่นมาก'
  if (pct >= 70) return 'หนาแน่น'
  if (pct >= 40) return 'เริ่มหนาแน่น'
  return 'ค่อนข้างว่าง'
}
const FLOOR_T = 'matrix(0,-.75,.75,0,-.000061035159,595.32)'

export default function LayerGreedy() {
  const [searchParams] = useSearchParams()
  const apiBase = (searchParams.get('gateway') || import.meta.env.VITE_GATEWAY_URL || '').replace(/\/$/, '')

  const [pulse, setPulse] = useState(true);
  const [deviceSize, setDeviceSize] = useState(typeof window !== 'undefined' ?
    (window.innerWidth >= 1024 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'mobile')
    : 'desktop')
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)

  const cam1Id = localStorage.getItem(PREVIEW_CAM1_KEY) || ''
  const [cam1Pct, setCam1Pct] = useState(0)
  const [cam1Count, setCam1Count] = useState(0)
  const abortRef = useRef(null)

  const fetchCam1 = useCallback(async () => {
    if (!apiBase || !cam1Id) return
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    try {
      const res = await fetch(apiBase + '/api/cameras', { signal: abortRef.current.signal })
      if (!res.ok) return
      const data = await res.json()
      const cam = data.find(c => String(c.id) === String(cam1Id))
      if (cam) {
        const count = cam.total_people || 0
        setCam1Count(count)
        setCam1Pct(Math.min(Math.round(count / CAM1_CAPACITY * 100), 100))
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('cam1 fetch error', e)
    }
  }, [apiBase, cam1Id])

  useEffect(() => {
    fetchCam1()
    const id = setInterval(fetchCam1, 2000)
    return () => { clearInterval(id); if (abortRef.current) abortRef.current.abort() }
  }, [fetchCam1])

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const size = width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile'
      setDeviceSize(size)
      setVw(width)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const gaugeScore  = cam1Id ? cam1Pct : 60
  const needleAngle = (gaugeScore / 100) * 180
  const gaugeColor  = gaugeScore >= 85 ? '#ef4444' : gaugeScore >= 70 ? '#f97316' : gaugeScore >= 40 ? '#f59e0b' : '#10b981'
  const gaugeLabel  = gaugeScore >= 85 ? 'หนาแน่นมาก' : gaugeScore >= 70 ? 'หนาแน่น' : gaugeScore >= 40 ? 'เริ่มหนาแน่น' : 'ค่อนข้างว่าง'
  const isCritical  = gaugeScore >= 85

  /* rank the centres by usage count (most-used first) — drives both the list
     numbers and the order/lead of the running characters below */
  const ranked = [...CENTERS].sort((a, b) => b.count - a.count)
  const maxCount = ranked[0].count

  /* small-phone proportions — shrink the chunky elements so the whole
     dashboard fits more comfortably on a narrow screen */
  const isMobile = deviceSize === 'mobile'
  const rowH      = isMobile ? 62 : 66    // ranking card height
  const coinSize  = isMobile ? 50 : 60    // ranking coin diameter
  const iconSize  = isMobile ? 54 : 64    // centre icon
  const laneH     = isMobile ? 80 : 110   // marathon lane height
  const cupH      = isMobile ? 60 : 84    // finish-line trophy
  const spriteH   = isMobile ? 86 : 115   // runner sprite

  return (
    <div className="h-screen w-full overflow-y-auto select-none" style={PAGE_BG}>
    <div className="min-h-full w-full text-[#F2E4CC] font-sans px-2 py-6 sm:px-4 sm:py-8 md:px-6 md:py-8 flex flex-col justify-center">

      {/* Rotate overlay: tablet portrait */}
      <div className="hidden md:portrait:flex fixed inset-0 z-[200] bg-[#1A0902]/95 backdrop-blur-sm flex-col items-center justify-center gap-8 pointer-events-none">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#C8982C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="16" rx="1.5" />
            <circle cx="12" cy="16.5" r="0.6" fill="#C8982C" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#E6B428" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
            className="absolute inset-0"
            style={{animation:'rotateHint 2s ease-in-out infinite'}}>
            <path d="M4.5 10.5 A8.5 8.5 0 0 1 19.5 10.5" />
            <polyline points="19.5 6.5 19.5 10.5 15.5 10.5" />
          </svg>
        </div>
        <div className="text-center px-8">
          <p className="text-[#E6B428] text-2xl font-bold tracking-wide">โปรดหมุนหน้าจอ</p>
          <p className="text-[#F2E4CC]/50 text-sm mt-2 leading-relaxed">แดชบอร์ดนี้ออกแบบสำหรับ<br />การแสดงผลแนวนอนเท่านั้น</p>
        </div>
        <style>{`@keyframes rotateHint{0%,100%{transform:rotate(0deg)}50%{transform:rotate(15deg)}}@keyframes rankBorderPulse{0%,100%{border-color:#10b981;box-shadow:0 0 4px #10b98144}50%{border-color:#6ee7b7;box-shadow:0 0 20px #10b981ff,0 0 40px #10b981aa}}@keyframes cupFloat{0%,100%{transform:translateY(0px) scale(1);filter:drop-shadow(0 4px 12px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(230,180,40,0.5))}50%{transform:translateY(-6px) scale(1.04);filter:drop-shadow(0 8px 16px rgba(0,0,0,0.5)) drop-shadow(0 0 18px rgba(230,180,40,1)) drop-shadow(0 0 30px rgba(230,180,40,0.6))}}`}</style>
      </div>

      <div className="w-full max-w-[1700px] mx-auto">
      {/* Main card */}
      <div className="bg-[#2A1208] rounded-2xl border-2 border-solid border-[#C8982C] p-5 sm:p-6 shadow-[0_0_32px_rgba(200,152,44,0.4)] relative overflow-hidden flex flex-col">

        {/* glow blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#E6B428]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#E0852A]/5 rounded-full blur-[120px] pointer-events-none" />

        {/* HEADER */}
        <div className="flex justify-between items-center gap-3 mb-5 pb-3 border-b border-[#4A2A10]/40">
          <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <div className="absolute w-12 h-12 rounded-full bg-[#E6B428]/15 animate-ping opacity-75" />
            <div className="w-11 h-11 bg-[#E6B428] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(230,180,40,0.55)] z-10">
              <Zap size={22} className="fill-black stroke-black stroke-[1.5]" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-wider text-white flex flex-wrap items-baseline gap-1.5">
              <span className="whitespace-nowrap">เทศบาลตำบลหัวรอ</span>
            </h1>
                  </div>
          </div>
        </div>

        {/* MAIN 3 COLUMNS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 min-h-[360px]">

          {/* COL 1: Camera density list */}
          <div className="bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col h-[260px] md:h-0 md:min-h-full overflow-hidden transition-all duration-300 hover:border-[#E6B428]">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h2 className="text-xs font-bold text-gray-300 tracking-wider">จำนวนครั้งที่ใช้งาน</h2>
              <div className={`w-1.5 h-1.5 rounded-full bg-[#E6B428] ${pulse ? 'animate-pulse' : ''}`} />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

              {/* Centres ranked by usage count — the number in the coin is the count */}
              {ranked.map((c, i) => {
                const top = i === 0
                const color = top ? '#10b981' : GREY
                const pct = Math.round((c.count / maxCount) * 100)   // ring fill, relative to #1
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
                          <span className="text-[11px] font-bold tracking-wide leading-snug break-words" style={{ color, textShadow: `0 0 8px ${color}80` }}>{c.name}</span>
                        </div>
                        <span className="text-[9px] font-semibold tracking-wide mt-0.5" style={{ color: `${color}cc` }}>{c.count.toLocaleString()} ครั้ง</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* COL 2: Gauge */}
          <div className="bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col justify-between items-center transition-all duration-300 hover:border-[#E6B428] h-[260px] md:h-0 md:min-h-full">
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

            <div className="flex items-center gap-1 text-xs lg:text-sm text-[rgb(242,228,204)] mt-1.5 lg:-mt-3">
            </div>
          </div>

          {/* COL 3: sports-style award podium (อันดับ 1–5) — far-right column */}
          <div className="bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col overflow-hidden transition-all duration-300 hover:border-[#E6B428] h-[260px] md:h-0 md:min-h-full" style={{ maxWidth: '100%' }}>
            <div className="flex justify-between items-center mb-3 flex-shrink-0 w-full">
              <h2 className="text-xs font-bold text-gray-300 tracking-wider">Anyone can be Someone</h2>
            </div>
            <div className="flex-1 min-h-0 flex items-end justify-center gap-0 pt-1">
              {[
                { rank: 4, h: 38, hTablet: 16, hMobile: 46 },
                { rank: 2, h: 52, hTablet: 20, hMobile: 60 },
                { rank: 1, h: 70, hTablet: 36, hMobile: 100 },
                { rank: 3, h: 43, hTablet: 18, hMobile: 50 },
                { rank: 5, h: 30, hTablet: 13, hMobile: 38 },
              ].map(({ rank, h, hTablet, hMobile }) => {
                const m = rank === 1 ? ['#FFE894', '#E6B428', '#9a6f12']
                        : rank === 2 ? ['#ECECF0', '#B9BDC6', '#777b83']
                        : rank === 3 ? ['#F2B984', '#CD7F32', '#86491a']
                        :              ['#6b5a44', '#473726', '#2c2216']
                const animSprite = rank === 1 ? CAPULIONWIN : rank === 2 ? WOLFLICANOLOSE : rank === 3 ? CATRAMELLOSE : rank === 4 ? BEARTELOSE : rank === 5 ? FOXCALOSE : null
                const frame = animSprite ? useSpriteFrame(animSprite) : 0
                /* on phones, fit the sprite to the real column width so the 5
                   characters never get squeezed/overlap: usable width = viewport
                   minus page(16) + card(40) + podium(32) padding, split 5 ways,
                   leaving a small gap — clamped to a sane 36–54px range */
                const mobileChar = Math.max(36, Math.min(54, Math.floor((vw - 88) / 5) - 6))
                const charSize = deviceSize === 'desktop' ? 90 : deviceSize === 'tablet' ? 16 : mobileChar
                const pedestalHeight = deviceSize === 'desktop' ? h : deviceSize === 'tablet' ? hTablet : hMobile
                return (
                  <div key={rank} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" style={{ marginRight: deviceSize === 'tablet' ? '-1px' : '0' }}>
                    {/* medal disc with the rank number or animation */}
                    {animSprite ? (
                      <div style={{
                        position: 'relative',
                        width: charSize,
                        height: charSize,
                        marginBottom: '0px',
                        flexShrink: 0,
                      }}>
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
                    
                    {/* pedestal block */}
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
            {/* podium floor */}
            <div className="h-[4px] rounded-full bg-gradient-to-r from-transparent via-[#C8982C]/70 to-transparent flex-shrink-0" />
          </div>

        </div>

        {/* BOTTOM: coffee-town street where all the characters run together */}
        <div className="border-2 border-solid border-[#B5851F] rounded-xl pt-3 pb-3 px-3 flex-shrink-0">
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
            {ranked.map((c, i) => (
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

      </div>
      </div>
    </div>
    </div>
  );
}
