import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsageTracking } from '../hooks/useUsageTracking.js'

const CONFIG_KEY = 'emojiGameConfig'
const MAX_PER_SIDE = 10
const SPARKLES = ['✨', '🌟', '💫', '⭐']

/* โหลด script จาก CDN ครั้งเดียว (สำหรับ html2canvas / html2pdf) */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

const pickShuffle = (arr, n) => [...(arr || [])].sort(() => Math.random() - 0.5).slice(0, Math.min(n, (arr || []).length))

function buildRound(cfg) {
  const stamp = Date.now()
  const correct = pickShuffle(cfg.correctImages, MAX_PER_SIDE).map((src, i) => ({ id: `c${i}-${stamp}`, src, isCorrect: true }))
  const wrong = pickShuffle(cfg.wrongImages, MAX_PER_SIDE).map((src, i) => ({ id: `w${i}-${stamp}`, src, isCorrect: false }))
  return [...correct, ...wrong].sort(() => Math.random() - 0.5)
}

/* รายงานผล HTML (port จากของเดิม) ใช้กับ html2canvas/html2pdf */
function reportHTML(cfg, score, total) {
  const d = new Date()
  const dateStr = d.toLocaleDateString('th-TH'), timeStr = d.toLocaleTimeString('th-TH')
  return `
  <div style="font-family:Arial,sans-serif;color:#333;width:600px;padding:20px;background:#fff;position:relative;">
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.05);font-weight:700;white-space:nowrap;">Espresso</div>
    <div style="position:absolute;top:10px;right:20px;font-size:12px;color:#666;">วันที่: ${dateStr} เวลา: ${timeStr}</div>
    <div style="text-align:center;margin:20px 0 15px;"><img src="/picture/kwang_logo3.png" style="height:80px;width:auto;" crossorigin="anonymous"/></div>
    <div style="text-align:center;background:linear-gradient(135deg,#ebd09e 0%,#251f03 100%);color:#fff;padding:15px;border-radius:8px;margin-bottom:15px;">
      <h1 style="margin:5px 0;font-size:24px;">รายงานผลการประเมินกิจกรรมสมาร์ทเช็ค</h1>
    </div>
    <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:15px;">
      <p style="font-size:13px;font-weight:bold;margin:0 0 8px;color:#251f03;">ข้อมูลกิจกรรม</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr><td style="padding:6px;font-weight:bold;width:30%;border-bottom:1px solid #eee;">สัปดาห์ที่:</td><td style="padding:6px;border-bottom:1px solid #eee;">${cfg.week || '-'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;border-bottom:1px solid #eee;">สาระการเรียนรู้:</td><td style="padding:6px;border-bottom:1px solid #eee;">${cfg.topic || '-'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;border-bottom:1px solid #eee;">หน่วยการเรียนรู้:</td><td style="padding:6px;border-bottom:1px solid #eee;">${cfg.unit || '-'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;border-bottom:1px solid #eee;">ครูผู้สอน:</td><td style="padding:6px;border-bottom:1px solid #eee;">${cfg.teacher || '-'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;border-bottom:1px solid #eee;">ระดับชั้น/ห้อง:</td><td style="padding:6px;border-bottom:1px solid #eee;">${cfg.classroom || '-'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;border-bottom:1px solid #eee;">ผู้ทดสอบ:</td><td style="padding:6px;border-bottom:1px solid #eee;">${cfg.userName || '-'}</td></tr>
      </table>
    </div>
    <div style="background:#f8f9fa;border:3px solid #251f03;border-radius:10px;padding:15px;margin-bottom:15px;text-align:center;">
      <p style="font-size:14px;margin:0 0 10px;color:#555;"><strong>คะแนนที่ได้รับ</strong></p>
      <p style="font-size:36px;color:#000;font-weight:bold;margin:0;">${score}/${total}</p>
    </div>
    <div style="margin-top:30px;text-align:center;">
      <p style="margin:0;font-size:12px;">ลงชื่อ _______________________</p>
      <p style="margin:6px 0 0;font-size:12px;">ครูผู้รับผิดชอบ</p>
      <p style="margin:6px 0 0;font-size:12px;">( _______________________ )</p>
    </div>
    <div style="font-size:11px;color:#666;text-align:right;margin-top:20px;line-height:1.3;">
      บริษัท กว้างไม่ จำกัด<br>263/1 ต.หัวรอ อ.เมือง จ.พิษณุโลก 65000<br>โทร: 083-654-9743 | www.kwamgunlimit.com
    </div>
  </div>`
}

export default function GamePicture() {
  useUsageTracking('gamepicture', 'gamepicture')
  const navigate = useNavigate()

  const cfgRef = useRef(JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'))
  const cfg = cfgRef.current
  const topicName = cfg.mainTopic || cfg.topic || 'กิจกรรม'
  const totalCorrect = cfg.correctImages?.length || 0

  const [images, setImages] = useState(() => buildRound(cfg))
  const [score, setScore] = useState(0)
  const [popup, setPopup] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [drag, setDrag] = useState(null)        // { id, dx, dy, startX, startY }
  const [particles, setParticles] = useState([])
  const [noConfig] = useState(() => !cfg.correctImages || !cfg.wrongImages)

  // sound
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false')
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem('gameVolume') || '1.0'))
  const [showVolume, setShowVolume] = useState(false)

  const correctRef = useRef(null)
  const wrongRef = useRef(null)
  const imgRefs = useRef({})
  const audioCtxRef = useRef(null)
  const startTimeRef = useRef(Date.now())
  const savedRef = useRef(false)

  // ── เสียง ─────────────────────────────────────────────
  const playClip = useCallback((file) => {
    if (!soundEnabled) return
    const a = new Audio(file)
    a.volume = volume
    a.play().catch(() => {})
  }, [soundEnabled, volume])
  const playSuccess = useCallback(() => playClip('/Sound/winner.mp3'), [playClip])
  const playFail = useCallback(() => playClip('/Sound/fail.mp3'), [playClip])

  const spawnParticles = (x, y) => {
    const batch = Array.from({ length: 6 }, (_, i) => ({
      key: `${Date.now()}-${i}`,
      char: SPARKLES[Math.floor(Math.random() * SPARKLES.length)],
      x: x + (Math.random() * 80 - 40),
      y: y + (Math.random() * 80 - 40),
      scale: Math.random() * 1.2 + 0.6,
    }))
    setParticles(p => [...p, ...batch])
    setTimeout(() => setParticles(p => p.filter(q => !batch.includes(q))), 600)
  }

  // ── บันทึกผลอัตโนมัติ ──────────────────────────────────
  const autoSave = useCallback(async (finalScore) => {
    if (savedRef.current) return
    savedRef.current = true
    let clientId = localStorage.getItem('huaroa_client_id')
    if (!clientId) {
      clientId = 'c-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36)
      localStorage.setItem('huaroa_client_id', clientId)
    }
    let reportImage = null
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
      const tmp = document.createElement('div')
      tmp.style.cssText = 'position:absolute;left:-9999px;top:0;'
      tmp.innerHTML = reportHTML(cfg, finalScore, totalCorrect || 1)
      document.body.appendChild(tmp)
      const canvas = await window.html2canvas(tmp.firstElementChild, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff' })
      reportImage = canvas.toDataURL('image/png')
      document.body.removeChild(tmp)
    } catch { /* report image optional */ }
    const pct = totalCorrect > 0 ? Math.min(100, Math.round((finalScore / totalCorrect) * 100)) : 0
    try {
      await fetch('/api/game-results', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId, gameType: 'gamepicture',
          topic: cfg.mainTopic || cfg.topic || null, unit: cfg.unit || null, week: cfg.week || null,
          teacher: cfg.teacher || null, userName: cfg.userName || null, classroom: cfg.classroom || null,
          score: finalScore, totalQuestions: totalCorrect, correctAnswers: finalScore, wrongAnswers: 0,
          percentage: pct, duration: Date.now() - startTimeRef.current, config: cfg, reportImage,
        }),
      })
    } catch (e) { console.warn('autoSave failed', e) }
  }, [cfg, totalCorrect])

  // ── ดาวน์โหลด PDF ─────────────────────────────────────
  const downloadPdf = async () => {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
      const el = document.createElement('div')
      el.innerHTML = reportHTML(cfg, score, totalCorrect)
      window.html2pdf().set({
        margin: [12, 12, 12, 12],
        filename: `${cfg.topic || 'score'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      }).from(el).save()
    } catch (e) { console.error('pdf failed', e) }
  }

  // ── ตรรกะการวางรูป ────────────────────────────────────
  const resolveDrop = (img, zone) => {
    let delta = 0, ok
    if (zone === 'correct') { ok = img.isCorrect; delta = img.isCorrect ? 1 : -1 }
    else { ok = !img.isCorrect; delta = img.isCorrect ? -1 : 0 }
    if (ok) playSuccess(); else playFail()
    if (delta !== 0) setScore(s => s + delta)
    setImages(prev => {
      const next = prev.filter(x => x.id !== img.id)
      if (next.length === 0) {
        const finalScore = score + delta
        setTimeout(() => { setPopup(true); autoSave(finalScore) }, 50)
      }
      return next
    })
  }

  const onDown = (img) => (e) => {
    e.preventDefault()
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)() } catch { /* */ }
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ id: img.id, dx: 0, dy: 0, startX: e.clientX, startY: e.clientY })
  }
  const onMove = (e) => {
    setDrag(d => (d ? { ...d, dx: e.clientX - d.startX, dy: e.clientY - d.startY } : d))
  }
  const onUp = (img) => (e) => {
    const el = imgRefs.current[img.id]
    setDrag(null)
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const inside = (ref) => {
      if (!ref.current) return false
      const z = ref.current.getBoundingClientRect()
      return cx > z.left && cx < z.right && cy > z.top && cy < z.bottom
    }
    if (inside(correctRef)) { spawnParticles(cx, cy); resolveDrop(img, 'correct') }
    else if (inside(wrongRef)) { spawnParticles(cx, cy); resolveDrop(img, 'wrong') }
  }

  const playAgain = () => {
    savedRef.current = false
    startTimeRef.current = Date.now()
    setScore(0)
    setImages(buildRound(cfg))
    setPopup(false)
    setShareOpen(false)
  }

  const toggleSound = () => {
    setSoundEnabled(v => {
      const nv = !v
      localStorage.setItem('soundEnabled', nv ? 'true' : 'false')
      return nv
    })
  }
  useEffect(() => { localStorage.setItem('gameVolume', String(volume)) }, [volume])

  if (noConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] gap-4 bg-gradient-to-b from-[#ebd09e] to-[#251f03] text-white">
        <p className="text-xl">ไม่พบข้อมูลกิจกรรม กรุณาสร้างกิจกรรมก่อน</p>
        <button className="px-6 py-3 rounded-full bg-[#74640a] text-white" onClick={() => navigate('/teacherpicture')}>ไปหน้าครู</button>
      </div>
    )
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden font-[Roboto,sans-serif] bg-gradient-to-b from-[#ebd09e] to-[#251f03]">
      {/* ปุ่มย้อนกลับ */}
      <button onClick={() => navigate('/teacherpicture')} title="กลับหน้าครู"
        className="fixed top-[15px] left-[15px] z-[1001] w-[50px] h-[50px] flex items-center justify-center text-[32px] font-bold text-[#74640a] rounded-full border-4 border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[0_4px_8px_rgba(0,0,0,0.2)] hover:scale-110 transition">&lt;</button>

      {/* ควบคุมเสียง */}
      <div className="fixed top-[15px] right-[50px] z-[1000] flex items-center gap-2.5"
        onMouseLeave={() => setShowVolume(false)}>
        {!showVolume && (
          <img src={soundEnabled ? '/picture/open.png' : '/picture/close.png'} alt="sound"
            onClick={() => setShowVolume(true)}
            className="w-[50px] h-[50px] cursor-pointer hover:scale-110 transition" />
        )}
        {showVolume && (
          <div className="flex items-center gap-2.5 bg-white/95 px-[15px] py-2.5 rounded-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <img src={soundEnabled ? '/picture/open.png' : '/picture/close.png'} alt="mute"
              onClick={toggleSound} className="w-6 h-6 cursor-pointer [filter:brightness(0)]" />
            <input type="range" min="0" max="100" value={soundEnabled ? Math.round(volume * 100) : 0}
              onChange={(e) => { setVolume(e.target.value / 100); if (!soundEnabled) toggleSound() }}
              className="w-[100px] accent-[#8b6914] cursor-pointer" />
            <div className="min-w-[40px] text-center font-bold text-sm text-[#333]">{soundEnabled ? Math.round(volume * 100) : 0}%</div>
          </div>
        )}
      </div>

      {/* หัวข้อ + คะแนน */}
      <div className="pt-[18px] text-center">
        <h2 className="mx-auto w-fit flex items-center justify-center text-black font-bold rounded-full border-[6px] border-[#74640a] px-4 py-1.5 text-[clamp(0.9rem,1.2vw,1.1rem)] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-4px_3px_#3b3305,0_0_10px_rgba(255,0,0,0.45)]">
          หัวข้อกิจกรรม:&nbsp;{topicName}
        </h2>
        <p className="text-[26px] font-bold text-[#333] mt-4 mb-1.5">
          Score: <span className="text-[34px] text-[#27ae60]">{score}</span>
        </p>
      </div>

      {/* โซนถูก/ผิด */}
      <div className="flex gap-4 justify-center items-center px-3 mt-2">
        <div ref={correctRef} className="relative w-2/5 h-[260px] rounded-[18px] flex items-center justify-center text-[72px] border-4 border-dashed border-[#27ae60] text-[#27ae60] bg-[linear-gradient(135deg,#e0ffe8_0%,#b2f7c1_100%)] shadow-[0_10px_30px_rgba(14,226,17,0.1)]">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-lg font-bold">ถูก</div>✔️
        </div>
        <div ref={wrongRef} className="relative w-2/5 h-[260px] rounded-[18px] flex items-center justify-center text-[72px] border-4 border-dashed border-[#e74c3c] text-[#e74c3c] bg-[linear-gradient(135deg,#ffe0e0_0%,#f7b2b2_100%)] shadow-[0_10px_30px_rgba(231,76,60,0.1)]">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-lg font-bold">ผิด</div>❌
        </div>
      </div>

      {/* รูปที่ลากได้ */}
      <div className="flex flex-wrap gap-4 justify-center items-start content-start px-4 mt-6 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 430px)' }}>
        {images.map(img => {
          const active = drag?.id === img.id
          return (
            <div
              key={img.id}
              ref={el => { imgRefs.current[img.id] = el }}
              onPointerDown={onDown(img)}
              onPointerMove={active ? onMove : undefined}
              onPointerUp={onUp(img)}
              className="w-[140px] h-[140px] cursor-grab active:cursor-grabbing touch-none select-none rounded-lg overflow-hidden shadow-md bg-white/40"
              style={{
                transform: active ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.05)` : 'translate(0,0)',
                transition: active ? 'none' : 'transform 0.2s ease',
                zIndex: active ? 50 : 1,
                touchAction: 'none',
              }}
            >
              <img src={img.src} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />
            </div>
          )
        })}
      </div>

      {/* particles */}
      {particles.map(p => (
        <span key={p.key} className="fixed pointer-events-none z-[60] [animation:tpFade_0.6s_ease-out_forwards]"
          style={{ left: p.x, top: p.y, transform: `scale(${p.scale})` }}>{p.char}</span>
      ))}
      <style>{`@keyframes tpFade{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-40px) scale(1.4)}}`}</style>

      {/* popup คะแนน */}
      {popup && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] text-center px-8 py-6 rounded-[20px] border-[6px] border-[#74640a] bg-[linear-gradient(135deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[0_0_40px_rgba(116,100,10,0.5),0_10px_30px_rgba(0,0,0,0.3)]">
          <p className="text-xl font-semibold mb-2 text-[#3b3305]">หัวข้อกิจกรรม: {topicName}</p>
          <p className="text-[28px] font-bold mb-4">{score > 0 ? '🎉 ยินดีด้วย! คุณทำได้ดีมาก 🎉' : '😢 ลองใหม่อีกครั้งนะ 😢'}</p>
          <p className="text-[32px] font-bold my-5 text-[#74640a]">🏆 คะแนนของคุณ: <span className="text-[#8b6914]">{score}/{totalCorrect}</span> ⭐</p>
          <div className="flex justify-center gap-4 my-6">
            <button onClick={playAgain} title="เล่นอีกครั้ง" className="w-[75px] h-[75px] rounded-full border-4 border-[#74640a] text-[38px] flex items-center justify-center bg-[linear-gradient(135deg,#c9a668_0%,#a68944_100%)] shadow-[0_6px_12px_rgba(0,0,0,0.4)] hover:scale-110 transition">🔄</button>
            <div className="relative">
              <button onClick={() => setShareOpen(o => !o)} title="แชร์/บันทึก" className="w-[75px] h-[75px] rounded-full border-4 border-[#74640a] text-[38px] flex items-center justify-center bg-[linear-gradient(135deg,#a68944_0%,#8b7530_100%)] shadow-[0_6px_12px_rgba(0,0,0,0.4)] hover:scale-110 transition">📊</button>
              {shareOpen && (
                <div className="absolute bottom-[85px] left-1/2 -translate-x-1/2 min-w-[180px] rounded-[20px] overflow-hidden border-4 border-[#74640a] bg-[linear-gradient(135deg,#f8f6f0_0%,#fff8e8_100%)] shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-[10000]">
                  <button onClick={() => { downloadPdf(); setShareOpen(false) }} className="w-full px-5 py-[18px] text-white text-lg font-bold flex items-center justify-center gap-3 bg-[linear-gradient(135deg,#d4a574,#8b6914)] hover:scale-105 transition">
                    <span className="text-[28px]">💾</span> ดาวน์โหลด PDF
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setPopup(false)} title="ปิด" className="w-[75px] h-[75px] rounded-full border-4 border-[#5a4d08] text-[42px] font-bold text-white flex items-center justify-center bg-[linear-gradient(135deg,#8b7530_0%,#6d5e26_100%)] shadow-[0_6px_12px_rgba(0,0,0,0.4)] hover:scale-110 transition">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
