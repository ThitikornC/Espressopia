import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, ArrowUpRight } from 'lucide-react';
import StatsCards from './StatsCards.jsx';
import Marathon from './Marathon.jsx';

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

  const gaugeScore  = cam1Id ? cam1Pct : 60

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

        {/* MAIN 3 COLUMNS GRID (ranking · gauge · podium) — see StatsCards.jsx */}
        <div className="mb-6">
          <StatsCards gaugeScore={gaugeScore} />
        </div>

        {/* BOTTOM: coffee-town street where all the characters run together */}
        <Marathon />
      </div>
      </div>
    </div>
    </div>
  );
}
