import { useState, useEffect } from 'react'
import { useUsageTracking } from '../hooks/useUsageTracking.js'
import { useClientConfig } from '../hooks/useClientConfig.js'

const PANEL = 'flex flex-col gap-1 items-start p-3 sm:px-5 rounded-[20px] text-black border-8 border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-10px_8px_#3b3305,0_0_28px_rgba(255,230,160,0.62)] flex-1 max-w-[520px] min-h-[140px] box-border'
const NEON_INPUT = 'w-full p-2.5 border-2 border-[#74640a] rounded-lg text-[15px] mb-3 font-[Roboto,sans-serif]'

export default function Menu() {
  useUsageTracking('menu', 'menu-home')
  const client = useClientConfig()

  const [stats, setStats] = useState({ connections: 0, distinct: 0, daily: 0, ever: 0 })
  const [fb, setFb] = useState({ open: false, name: '', phone: '', text: '' })

  // ดึงสถิติผู้ใช้ทุก 10 วิ (แทน socket — เลี่ยงเพิ่ม dependency)
  useEffect(() => {
    let active = true
    const fetchStats = async () => {
      try {
        const res = await fetch('/status/active-clients')
        if (!res.ok) return
        const d = await res.json()
        if (!active || !d?.success) return
        setStats({
          connections: d.activeConnections ?? d.activeClients ?? 0,
          distinct: d.distinctActiveClientIds ?? 0,
          daily: d.dailyUniqueToday ?? 0,
          ever: d.totalEverUsers ?? 0,
        })
      } catch { /* ignore */ }
    }
    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => { active = false; clearInterval(id) }
  }, [])

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

  const marqueeItems = ['Kwang Unlimit', 'Espresso', 'Kwang Unlimit', 'Espresso']

  return (
    <div className="relative h-[100dvh] w-full overflow-y-auto overflow-x-hidden font-[Roboto,sans-serif] flex flex-col items-center py-8 px-3 sm:px-6">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,#8b6a3a_0%,#5a3f22_45%,#6f4a9b_100%)]" />
      {/* watermark */}
      <img src="/picture/ESPRESSO_logo.png" alt="" aria-hidden
        className="fixed top-[62%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-[40vw] max-w-[600px] opacity-[0.13] pointer-events-none select-none -z-[1]" />

      <style>{`@keyframes tpMarquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>

      {/* top bar: marquee + stats */}
      <div className="w-full flex items-center justify-center gap-4 flex-wrap mt-4 mb-6">
        <div className="flex-1 min-w-[280px] max-w-[1600px] overflow-hidden relative rounded-full border-4 border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fff8e8_50%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-6px_4px_#3b3305,0_0_20px_rgba(255,230,160,0.55)] py-3">
          <div className="flex min-w-[220%] [animation:tpMarquee_30s_linear_infinite]">
            {[0, 1].map(g => (
              <div className="flex items-center mr-8" key={g}>
                {marqueeItems.map((t, i) => (
                  <span key={i} className="inline-flex items-center whitespace-nowrap uppercase font-bold text-xs sm:text-sm px-4 py-1.5 mr-3 rounded-md border-2 border-black bg-[linear-gradient(180deg,#f8f6f0_0%,#fff8e8_50%,#f5f0e5_100%)] shadow-[2px_2px_0_#000,-1px_-1px_0_#000]">{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="font-bold text-white text-sm flex flex-col gap-0.5 drop-shadow">
          <div>จำนวนเชื่อมต่อ: {stats.connections}</div>
          <div>กำลัง active: {stats.distinct}</div>
          <div>ผู้ใช้วันนี้: {stats.daily}</div>
          <div>ผู้ใช้ทั้งหมด: {stats.ever}</div>
        </div>
      </div>

      {/* client info panels */}
      <div className="w-full flex flex-row gap-4 justify-center items-stretch flex-nowrap mb-8">
        <div className={PANEL}>
          <div className="font-bold text-[clamp(1rem,1.6vw,1.25rem)] [text-shadow:0_2px_6px_rgba(0,0,0,0.32)]">{client?.clientName || 'Loading...'}</div>
          <div className="font-bold text-sm">Usernumber : {client?.runNumber ?? '...'}</div>
          <div className="text-sm">Contractnumber : {client?.contractNo ?? '-'}</div>
          <div className="text-sm">Date Installed : {client?.installDate ?? '...'}</div>
          <div className="text-sm">Expiration Date : {client?.expiryDate ?? '...'}</div>
        </div>
        <div className={PANEL}>
          <div className="font-bold text-[clamp(1rem,1.6vw,1.25rem)]">Active Users : {stats.distinct}</div>
          <div className="font-bold text-[clamp(1rem,1.6vw,1.25rem)]">Total Users : {stats.ever}</div>
        </div>
      </div>

      {/* main Espresso button → /catagoly (legacy ผ่าน proxy) */}
      <a href="/catagoly"
        className="relative inline-flex items-center justify-center uppercase font-bold text-white rounded-xl px-8 py-4 text-[clamp(1rem,2vw,1.5rem)] border-[6px] border-[#74640a] bg-[#7d1007] no-underline overflow-hidden shadow-[1px_1px_0_#000,-8px_6px_#3b3305,0_0_18px_rgba(255,230,160,0.6)] hover:scale-105 hover:-translate-y-0.5 transition [animation:tpGlow_3s_ease-in-out_infinite]">
        Espresso
      </a>
      <style>{`@keyframes tpGlow{0%,100%{box-shadow:1px 1px 0 #000,-8px 6px #3b3305,0 0 20px rgba(255,230,160,0.55)}50%{box-shadow:1px 1px 0 #000,-8px 6px #3b3305,0 0 35px rgba(255,230,160,0.85),0 0 50px rgba(255,200,100,0.4)}}`}</style>

      {/* contact button */}
      <button onClick={() => setFb(f => ({ ...f, open: true }))}
        className="mt-4 inline-flex items-center justify-center font-bold text-black rounded-full px-8 py-3 border-[6px] border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-8px_6px_#3b3305,0_0_18px_rgba(255,230,160,0.6)] hover:scale-105 transition">
        ติดต่อ
      </button>

      {/* version badge */}
      <div className="fixed right-3 bottom-2.5 z-[60] text-white font-bold text-sm pointer-events-none">V.11225</div>

      {/* feedback modal */}
      {fb.open && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={() => setFb(f => ({ ...f, open: false }))}>
          <div className="max-w-[500px] w-full p-10 rounded-[20px] border-[6px] border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] shadow-[1px_1px_0_#000,-8px_6px_#3b3305,0_0_30px_rgba(255,230,160,0.7)]" onClick={e => e.stopPropagation()}>
            <h2 className="text-[#333] mb-5 text-[28px] font-bold">ติดต่อบริษัท</h2>
            <input className={NEON_INPUT} placeholder="ชื่อของคุณ" value={fb.name} onChange={e => setFb(f => ({ ...f, name: e.target.value }))} />
            <input className={NEON_INPUT} placeholder="เบอร์โทรศัพท์ผู้ติดต่อ" value={fb.phone} onChange={e => setFb(f => ({ ...f, phone: e.target.value }))} />
            <textarea className="w-full min-h-[120px] p-4 border-[3px] border-[#74640a] rounded-[10px] text-base resize-y font-[Roboto,sans-serif] mb-5"
              placeholder="กรุณาแสดงความคิดเห็นหรือข้อเสนอแนะของคุณ..." value={fb.text} onChange={e => setFb(f => ({ ...f, text: e.target.value }))} />
            <div className="flex gap-4 justify-center">
              <button onClick={submitFeedback} className="font-bold text-black rounded-full px-5 py-2 border-[6px] border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fff8e8_100%)] shadow-[1px_1px_0_#000,-4px_3px_#3b3305] hover:scale-105 transition">ส่งคำแนะนำ</button>
              <button onClick={() => setFb({ open: false, name: '', phone: '', text: '' })} className="font-bold text-black rounded-full px-5 py-2 border-[6px] border-[#74640a] bg-[linear-gradient(180deg,#f8f6f0_0%,#fff8e8_100%)] shadow-[1px_1px_0_#000,-4px_3px_#3b3305] hover:scale-105 transition">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
