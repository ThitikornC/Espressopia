import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsageTracking } from '../hooks/useUsageTracking.js'

const NEON = 'inline-flex items-center justify-center text-black font-light no-underline cursor-pointer rounded-full border-[6px] border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-8px_6px_#3b3305,0_0_20px_rgba(255,230,160,0.55)] hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#000,-10px_8px_#3b3305,0_0_25px_rgba(255,230,160,0.75)] transition whitespace-nowrap'
const MODE = `${NEON} w-[clamp(200px,32vw,360px)] min-h-[clamp(72px,9vh,104px)] px-[clamp(10px,2.2vw,16px)] py-[clamp(16px,3vh,28px)] text-[clamp(1rem,2.2vw,1.25rem)]`
const NEON_INPUT = 'w-full p-2.5 border-2 border-[#74640a] rounded-lg text-[15px] mb-3 font-[Roboto,sans-serif]'

// โหมดที่เป็น legacy (ยังไม่แปลง) → นำทางแบบเต็มหน้า (Vite proxy → backend)
const LEGACY_MODES = [
  { label: 'ตัวเลข', href: '/teachermatch.html' },
  { label: 'ภาษา', href: '/teacherthai.html' },
  { label: 'สตูดิโอ', href: '/studio/' },
  { label: 'สมาร์ทแทรค', href: '/BMI.html' },
]

export default function Catagoly() {
  useUsageTracking('catagoly', 'category-home')
  const navigate = useNavigate()
  const [info, setInfo] = useState(false)
  const [fb, setFb] = useState({ open: false, name: '', phone: '', text: '' })
  const pressTimer = useRef(null)
  const longPressed = useRef(false)

  // กดค้าง 800ms ที่ "สมาร์ทเช็ค" → เปิด info; กดปกติ → ไป /teacherpicture
  const startPress = () => {
    longPressed.current = false
    pressTimer.current = setTimeout(() => { longPressed.current = true; setInfo(true) }, 800)
  }
  const endPress = () => clearTimeout(pressTimer.current)
  const onSmartCheck = () => {
    clearTimeout(pressTimer.current)
    if (!longPressed.current) navigate('/teacherpicture')
  }

  const submitFeedback = async () => {
    if (!fb.name.trim()) return alert('กรุณากรอกชื่อของคุณ')
    if (!fb.phone.trim()) return alert('กรุณากรอกเบอร์โทรศัพท์ผู้ติดต่อ')
    if (!fb.text.trim()) return alert('กรุณากรอกข้อเสนอแนะก่อนส่ง')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fb.name, phone: fb.phone, feedback: fb.text, timestamp: new Date().toISOString() }),
      })
      const result = await res.json()
      if (result.success) { alert('✅ ส่งข้อเสนอแนะสำเร็จ!\nขอบคุณสำหรับความคิดเห็นของคุณ'); setFb({ open: false, name: '', phone: '', text: '' }) }
      else alert('❌ เกิดข้อผิดพลาด: ' + result.message)
    } catch {
      alert('❌ ไม่สามารถส่งข้อเสนอแนะได้\nกรุณาตรวจสอบว่า Server กำลังทำงานอยู่')
    }
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden font-[Roboto,sans-serif] flex flex-col items-center justify-center text-center px-5 py-10 gap-6">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#ebd09e_0%,#251f03_100%)]" />

      <h1 className="text-white font-bold text-[clamp(1.5rem,4vw,2.5rem)] mb-4 [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">เลือกโหมด</h1>

      {/* สมาร์ทเช็ค → React /teacherpicture (กดค้างดูรายละเอียด) */}
      <button
        className={MODE}
        onClick={onSmartCheck}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
      >สมาร์ทเช็ค</button>

      {/* โหมด legacy */}
      {LEGACY_MODES.map(m => (
        <a key={m.href} href={m.href} className={MODE}>{m.label}</a>
      ))}

      {/* ปุ่มติดต่อ */}
      <button onClick={() => setFb(f => ({ ...f, open: true }))}
        className={`${NEON} fixed bottom-8 right-8 z-[9999] px-7 py-3 text-base md:bottom-8 md:right-8`}>ติดต่อ</button>

      {/* Info modal */}
      {info && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={() => setInfo(false)}>
          <div className="max-w-[500px] w-full p-10 rounded-[20px] border-[6px] border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-8px_6px_#3b3305,0_0_30px_rgba(255,230,160,0.7)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-[#333] mb-5 text-[28px] font-bold text-center">สมาร์ทเช็ค</h2>
            <p className="text-[#555] text-lg leading-8 text-center mb-5">แบบฝึกหัดตรวจความเข้าใจที่รวดเร็ว ใช้งานง่าย และเหมาะกับทุกเนื้อหา</p>
            <div className="flex justify-center">
              <button onClick={() => setInfo(false)} className={`${NEON} px-8 py-2 text-base`}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback modal */}
      {fb.open && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={() => setFb(f => ({ ...f, open: false }))}>
          <div className="max-w-[500px] w-full p-10 rounded-[20px] border-[6px] border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-8px_6px_#3b3305,0_0_30px_rgba(255,230,160,0.7)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-[#333] mb-5 text-[28px] font-bold">ติดต่อบริษัท</h2>
            <input className={NEON_INPUT} placeholder="ชื่อของคุณ" value={fb.name} onChange={e => setFb(f => ({ ...f, name: e.target.value }))} />
            <input className={NEON_INPUT} placeholder="เบอร์โทรศัพท์ผู้ติดต่อ" value={fb.phone} onChange={e => setFb(f => ({ ...f, phone: e.target.value }))} />
            <textarea className="w-full min-h-[120px] p-4 border-[3px] border-[#74640a] rounded-[10px] text-base resize-y font-[Roboto,sans-serif] mb-5"
              placeholder="กรุณาแสดงความคิดเห็นหรือข้อเสนอแนะของคุณ..." value={fb.text} onChange={e => setFb(f => ({ ...f, text: e.target.value }))} />
            <div className="flex gap-4 justify-center">
              <button onClick={submitFeedback} className={`${NEON} px-5 py-2 text-base`}>ส่งคำแนะนำ</button>
              <button onClick={() => setFb({ open: false, name: '', phone: '', text: '' })} className={`${NEON} px-5 py-2 text-base`}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
