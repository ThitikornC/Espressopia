import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, ArrowUpRight } from 'lucide-react';
import { BEAR, WOLF, FOX, CAPULION, CAT, SpriteLane } from './sprites.jsx';

/* Same parchment map + warm vignette backdrop as the Espressopia landing page */
const BASE   = import.meta.env.BASE_URL || '/'
const BG_URL = `${BASE}assets/Espresso/Espresso/BG.png`
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

/* ── Floor2 plan constants ──────────────────────────────────────────────── */
const FLOOR2_KEY = 'floor2_zones'
const PREVIEW_CAM1_KEY = 'preview_cam1_id'
const CAM1_CAPACITY = 50

const MOCK_CAMS = [
  { id: '2',  label: 'กล้อง 2',  pct: 45 },
  { id: '3',  label: 'กล้อง 3',  pct: 72 },
  { id: '4',  label: 'กล้อง 4',  pct: 30 },
  { id: '5',  label: 'กล้อง 5',  pct: 88 },
  { id: '6',  label: 'กล้อง 6',  pct: 55 },
  { id: '7',  label: 'กล้อง 7',  pct: 19 },
  { id: '8',  label: 'กล้อง 8',  pct: 63 },
  { id: '9',  label: 'กล้อง 9',  pct: 41 },
  { id: '10', label: 'กล้อง 10', pct: 77 },
  { id: '11', label: 'กล้อง 11', pct: 93 },
  { id: '12', label: 'กล้อง 12', pct: 36 },
  { id: '13', label: 'กล้อง 13', pct: 58 },
]

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

  const gaugeScore  = cam1Id ? cam1Pct : 60
  const needleAngle = (gaugeScore / 100) * 180
  const gaugeColor  = gaugeScore >= 85 ? '#ef4444' : gaugeScore >= 70 ? '#f97316' : gaugeScore >= 40 ? '#f59e0b' : '#10b981'
  const gaugeLabel  = gaugeScore >= 85 ? 'หนาแน่นมาก' : gaugeScore >= 70 ? 'หนาแน่น' : gaugeScore >= 40 ? 'เริ่มหนาแน่น' : 'ค่อนข้างว่าง'
  const isCritical  = gaugeScore >= 85

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
        <style>{`@keyframes rotateHint{0%,100%{transform:rotate(0deg)}50%{transform:rotate(15deg)}}`}</style>
      </div>

      <div className="w-full max-w-[960px] mx-auto">
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
              <span className="whitespace-nowrap">LAYER 1: GREEDY</span>
              <span className="text-gray-400 font-medium text-xs whitespace-nowrap">(REAL-TIME DECISION)</span>
            </h1>
            <p className="text-[10px] text-[#B89A6A] font-light mt-0.5">
              เลือกสิ่งที่ดีที่สุด ณ เวลาปัจจุบัน เพื่อการตอบสนองและแจ้งเตือนทันที
            </p>
          </div>
          </div>
        </div>

        {/* MAIN 2 COLUMNS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 min-h-[330px]">

          {/* COL 1: Camera density list */}
          <div className="bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col h-[260px] md:h-0 md:min-h-full overflow-hidden transition-all duration-300 hover:border-[#E6B428]">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h2 className="text-xs font-bold text-gray-300 tracking-wider">ความหนาแน่นของโซน</h2>
              <div className={`w-1.5 h-1.5 rounded-full bg-[#E6B428] ${pulse ? 'animate-pulse' : ''}`} />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

              {/* Camera 1 — Real API */}
              {(() => {
                const pct = cam1Pct
                const color = camColor(pct)
                const live = !!cam1Id && !!apiBase
                return (
                  <div className="flex items-center h-[52px] cursor-default group w-full">
                    <div className="w-[56px] h-[56px] flex-shrink-0 flex items-center justify-center select-none relative z-10">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="#321609" className="transition-colors duration-300 group-hover:fill-[#3D1E0A]" />
                        <g transform="rotate(-90 50 50)">
                          <circle cx="50" cy="50" r="36" fill="none" stroke={pct > 0 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="0" />
                          <circle cx="50" cy="50" r="36" fill="none" stroke={pct >= 25 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-56.55" />
                          <circle cx="50" cy="50" r="36" fill="none" stroke={pct >= 50 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-113.1" />
                          <circle cx="50" cy="50" r="36" fill="none" stroke={pct >= 75 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-169.65" />
                        </g>
                        <text x="50" y="56" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="system-ui,-apple-system,sans-serif">{pct}%</text>
                      </svg>
                    </div>
                    <div className="flex-1 flex items-center h-full -ml-7 bg-[#241005] border-t border-b border-r border-solid rounded-r-xl pr-3 pl-8 transition-all duration-300 group-hover:bg-[#3D1E0A]" style={{ borderColor: color }}>
                      <div className="flex flex-col justify-center select-none min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold tracking-wide leading-snug truncate" style={{ color, textShadow: `0 0 8px ${color}80` }}>กล้อง 1</span>
                          {live && <span className="text-[7px] bg-[#E6B428]/20 text-[#E6B428] px-1 py-0.5 rounded font-bold tracking-wider flex-shrink-0">LIVE</span>}
                        </div>
                        <span className="text-[9px] font-semibold tracking-wide leading-snug mt-0.5 truncate" style={{ color: `${color}cc` }}>
                          {camLabel(pct)}{cam1Count > 0 ? ` · ${cam1Count} คน` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Cameras 2–13 — Mock */}
              {MOCK_CAMS.map(cam => {
                const color = camColor(cam.pct)
                return (
                  <div key={cam.id} className="flex items-center h-[52px] cursor-default group w-full">
                    <div className="w-[56px] h-[56px] flex-shrink-0 flex items-center justify-center select-none relative z-10">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="#321609" className="transition-colors duration-300 group-hover:fill-[#3D1E0A]" />
                        <g transform="rotate(-90 50 50)">
                          <circle cx="50" cy="50" r="36" fill="none" stroke={cam.pct > 0 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="0" />
                          <circle cx="50" cy="50" r="36" fill="none" stroke={cam.pct >= 25 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-56.55" />
                          <circle cx="50" cy="50" r="36" fill="none" stroke={cam.pct >= 50 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-113.1" />
                          <circle cx="50" cy="50" r="36" fill="none" stroke={cam.pct >= 75 ? color : '#3A2410'} strokeWidth="8" strokeDasharray="52.55 173.64" strokeDashoffset="-169.65" />
                        </g>
                        <text x="50" y="56" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="system-ui,-apple-system,sans-serif">{cam.pct}%</text>
                      </svg>
                    </div>
                    <div className="flex-1 flex items-center h-full -ml-7 bg-[#241005] border-t border-b border-r border-solid rounded-r-xl pr-3 pl-8 transition-all duration-300 group-hover:bg-[#3D1E0A]" style={{ borderColor: color }}>
                      <div className="flex flex-col justify-center select-none min-w-0">
                        <span className="text-[11px] font-bold tracking-wide leading-snug truncate" style={{ color, textShadow: `0 0 8px ${color}80` }}>{cam.label}</span>
                        <span className="text-[9px] font-semibold tracking-wide leading-snug mt-0.5 truncate" style={{ color: `${color}cc` }}>{camLabel(cam.pct)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* COL 2: Gauge */}
          <div className="bg-[#321609] border-2 border-solid border-[#B5851F] rounded-xl p-4 flex flex-col justify-between items-center transition-all duration-300 hover:border-[#E6B428]">
            <div className="w-full text-left">
              <h2 className="text-xs font-bold text-gray-300 tracking-wider">ระดับความหนาแน่น</h2>
            </div>

            <div className="relative w-full flex flex-col items-center">
              <svg className="w-full max-w-[280px]" viewBox="0 0 200 130">
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
              <p className="text-[13px] lg:text-[18px] font-bold tracking-wide lg:tracking-[3px] mt-1.5 lg:mt-0.5" style={{ color: gaugeColor }}>{gaugeLabel}</p>
            </div>

            {isCritical && (
              <div className="mt-2">
                <div className="border border-[#ef4444]/60 bg-[#ef4444]/5 text-[#ef4444] text-[10px] font-bold px-4 py-1.5 rounded-md tracking-widest uppercase animate-pulse">
                  CRITICAL
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs lg:text-sm text-[rgb(242,228,204)] mt-1.5 lg:-mt-3">
              <span>แนวโน้ม: เพิ่มขึ้น</span>
              <span className="text-[#ef4444] font-bold flex items-center">
                <ArrowUpRight size={14} className="stroke-[2.5]" />
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM: coffee-town street where all the characters run together */}
        <div className="border-2 border-solid border-[#B5851F] rounded-xl pt-3 pb-3 px-3 flex-shrink-0">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#C8982C]/40" />
            <h3 className="text-[9px] lg:text-xs font-bold text-[#C8982C] tracking-[0.15em] lg:tracking-[0.25em] uppercase text-center flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#C8982C] animate-pulse" />
              ESPRESSO TOWN · RUSH HOUR
            </h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#C8982C]/40" />
          </div>

          {/* street scene */}
          <div className="relative h-[150px] rounded-lg overflow-hidden border border-[#4A2A10]"
            style={{ background: 'radial-gradient(130% 100% at 50% 115%, #4A2410 0%, #2A1208 45%, #160800 100%)' }}>

            {/* warm glow blobs for atmosphere */}
            <div className="absolute -top-10 left-[15%] w-40 h-40 bg-[#E6B428]/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -top-8 right-[20%] w-36 h-36 bg-[#E0852A]/10 rounded-full blur-[55px] pointer-events-none" />

            {/* distant ground line */}
            <div className="absolute left-0 right-0" style={{ bottom: 46 }}>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C8982C]/25 to-transparent" />
            </div>

            {/* street */}
            <div className="absolute left-0 right-0 bottom-0 h-[40px]"
              style={{ background: 'linear-gradient(180deg, #321609 0%, #1C0B03 100%)', boxShadow: 'inset 0 2px 0 rgba(200,152,44,0.35)' }}>
              {/* dashed center line of the road */}
              <div className="absolute left-0 right-0 top-[20px] h-[2px]"
                style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(200,152,44,0.45) 0 18px, transparent 18px 40px)' }} />
            </div>

            {/* runners — bigger up front, smaller & faded toward the back (parallax) */}
            <SpriteLane sprite={FOX}      height={56} speed={26} startPos={20} bottom={58} opacity={0.85} />
            <SpriteLane sprite={CAT}      height={64} speed={22} startPos={78} bottom={50} opacity={0.9} />
            <SpriteLane sprite={WOLF}     height={76} speed={19} startPos={42} bottom={40} opacity={0.96} />
            <SpriteLane sprite={CAPULION} height={88} speed={16} startPos={62} bottom={26} />
            <SpriteLane sprite={BEAR}     height={98} speed={13} startPos={8}  bottom={18} />
          </div>
        </div>

      </div>
      </div>
      </div>
    </div>
  );
}
