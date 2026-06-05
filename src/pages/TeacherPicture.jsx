import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsageTracking } from '../hooks/useUsageTracking.js'
import { useClientConfig } from '../hooks/useClientConfig.js'

const CONFIG_KEY = 'emojiGameConfig'
const GRADES = [
  'อนุบาล 1', 'อนุบาล 2', 'อนุบาล 3',
  'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6',
  'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6',
]

/* คลาส Tailwind ที่ใช้ซ้ำ (เก็บเป็น string เต็มเพื่อให้ Tailwind สแกนเจอ) */
const CARD = 'w-full max-w-[900px] box-border bg-white/90 p-5 rounded-[10px] border-4 border-[#74640a] shadow-[0_0_15px_rgba(255,230,160,0.5),1px_1px_0_#000,-6px_4px_#3b3305]'
const INPUT = 'p-2.5 border-2 border-[#ccc] rounded-lg text-base w-full bg-white box-border text-[#333]'
const NEON = "cursor-pointer font-bold min-h-[48px] rounded-full px-[25px] py-3 text-[clamp(0.9rem,1.8vw,1.2rem)] text-black border-[6px] border-[#74640a] transition-all duration-300 bg-[linear-gradient(180deg,#f8f6f0_0%,#fffef8_45%,#fff8e8_55%,#f5f0e5_100%)] [text-shadow:0_1px_0_rgba(255,255,255,0.3)] shadow-[1px_1px_0_#000,-8px_6px_#3b3305,0_0_20px_rgba(255,230,160,0.55)] hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#000,-10px_8px_#3b3305,0_0_25px_rgba(255,230,160,0.75)]"
const OVERLAY = 'fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center'

/* ปรับขนาดเป็นจัตุรัส + ตัดพื้นหลังสีขาวออก (port ตรงจากของเดิม) */
function autoCropToSquare(img) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const maxSize = 300
  let width = img.width, height = img.height
  const isMobile = window.innerWidth <= 768
  if (!isMobile && (width > maxSize || height > maxSize)) {
    if (width > height) { height = (height / width) * maxSize; width = maxSize }
    else { width = (width / height) * maxSize; height = maxSize }
  }
  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  let bgColor = null
  for (const [x, y] of corners) {
    const idx = (y * width + x) * 4
    const r = data[idx], g = data[idx + 1], b = data[idx + 2]
    if (r > 200 && g > 200 && b > 200) { bgColor = { r, g, b }; break }
  }
  if (bgColor) {
    const threshold = 40
    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i] - bgColor.r) < threshold &&
        Math.abs(data[i + 1] - bgColor.g) < threshold &&
        Math.abs(data[i + 2] - bgColor.b) < threshold
      ) data[i + 3] = 0
    }
    ctx.putImageData(imageData, 0, 0)
  }
  return canvas.toDataURL('image/png', 0.9)
}

export default function TeacherPicture() {
  useUsageTracking('teacherpicture', 'teacher-config')
  const client = useClientConfig()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    week: '', topic: '', unit: '', teacher: '', grade: '', room: '', userName: '', mainTopic: '',
  })
  const [correctImages, setCorrectImages] = useState([])
  const [wrongImages, setWrongImages] = useState([])
  const [alertMsg, setAlertMsg] = useState(null)
  const [modal, setModal] = useState(null)          // null | {loading} | {teacherMap} | {error}
  const [openTeacher, setOpenTeacher] = useState(null)
  const [editing, setEditing] = useState(null)      // { teacherName, activityId, name }

  // โหลด config เก่าถ้ามี
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')
      setForm(f => ({
        ...f,
        topic: saved.topic || '', week: saved.week || '', unit: saved.unit || '',
        teacher: saved.teacher || '', mainTopic: saved.mainTopic || '', userName: saved.userName || '',
      }))
      if (Array.isArray(saved.correctImages)) setCorrectImages(saved.correctImages)
      if (Array.isArray(saved.wrongImages)) setWrongImages(saved.wrongImages)
    } catch { /* ignore */ }
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const classroom = form.room ? `${form.grade}/${form.room}` : form.grade

  const handleUpload = (type) => (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const cropped = autoCropToSquare(img)
        if (type === 'correct') setCorrectImages(arr => [...arr, cropped])
        else setWrongImages(arr => [...arr, cropped])
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }
  const removeImage = (type, i) => {
    if (type === 'correct') setCorrectImages(a => a.filter((_, j) => j !== i))
    else setWrongImages(a => a.filter((_, j) => j !== i))
  }

  const buildConfig = (defaults = {}) => ({
    week: form.week.trim() || '-',
    topic: form.topic.trim() || 'ไม่ระบุ',
    unit: form.unit.trim() || '-',
    teacher: form.teacher.trim() || defaults.teacher || 'ไม่ระบุ',
    mainTopic: form.mainTopic.trim() || 'ไม่ระบุ',
    classroom: classroom || '',
    userName: form.userName.trim() || 'ไม่ระบุ',
    correctImages, wrongImages,
  })

  const saveConfig = () => {
    if (!form.grade) { setAlertMsg('⚠️ กรุณาเลือกระดับชั้นก่อนเริ่มกิจกรรม'); return }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(buildConfig()))
    navigate('/gamepicture')
  }

  const saveActivity = async () => {
    if (!form.teacher.trim()) { setAlertMsg('กรุณากรอกชื่อครูผู้รับผิดชอบก่อนบันทึก'); return }
    if (correctImages.length === 0 && wrongImages.length === 0) {
      setAlertMsg('กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูปก่อนบันทึก'); return
    }
    const cfg = buildConfig()
    try {
      if (editing) {
        const res = await fetch(`/api/settings/picture/${encodeURIComponent(editing.teacherName)}/${editing.activityId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editing.name || `${cfg.mainTopic} - สัปดาห์ ${cfg.week}`, config: cfg }),
        })
        if (!res.ok) throw new Error('อัพเดทไม่สำเร็จ')
        setAlertMsg('✅ อัพเดทกิจกรรมสำเร็จ!')
        setEditing(null)
        return
      }
      const activityName = window.prompt('ตั้งชื่อกิจกรรม:', `${cfg.mainTopic} - สัปดาห์ ${cfg.week}`)
      if (!activityName) return
      const res = await fetch('/api/settings/picture', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherName: cfg.teacher, name: activityName, config: cfg }),
      })
      if (!res.ok) throw new Error('บันทึกไม่สำเร็จ')
      const data = await res.json()
      setAlertMsg(`✅ บันทึกกิจกรรม "${activityName}" สำเร็จ! รหัส: ${data.data?.activityId || '-'}`)
    } catch (err) {
      setAlertMsg('❌ เกิดข้อผิดพลาด: ' + err.message)
    }
  }

  const loadActivity = useCallback(async () => {
    setModal({ loading: true })
    setOpenTeacher(null)
    try {
      const res = await fetch('/api/settings/picture')
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
      const result = await res.json()
      const teacherMap = {}
      for (const a of (result.data || [])) {
        (teacherMap[a.teacherName] ||= []).push(a)
      }
      setModal({ teacherMap })
    } catch (err) {
      setModal({ error: err.message })
    }
  }, [])

  const playActivity = (activity) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(activity.config))
    navigate('/gamepicture')
  }
  const editActivity = (teacherName, activity) => {
    const c = activity.config || {}
    setForm({
      week: c.week || '', topic: c.topic || '', unit: c.unit || '', teacher: c.teacher || '',
      grade: '', room: '', userName: c.userName || '', mainTopic: c.mainTopic || '',
    })
    setCorrectImages(c.correctImages || [])
    setWrongImages(c.wrongImages || [])
    setEditing({ teacherName, activityId: activity.activityId, name: activity.name })
    setModal(null)
    setAlertMsg(`📝 กำลังแก้ไข "${activity.name}" — แก้ข้อมูลแล้วกด "บันทึกกิจกรรม" เพื่ออัพเดท`)
  }
  const deleteActivity = async (teacherName, activityId) => {
    if (!window.confirm(`ต้องการลบกิจกรรม รหัส ${activityId} หรือไม่?`)) return
    try {
      const res = await fetch(`/api/settings/picture/${encodeURIComponent(teacherName)}/${activityId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      setAlertMsg('✅ ลบกิจกรรมสำเร็จ!')
      loadActivity()
    } catch (err) {
      setAlertMsg('❌ เกิดข้อผิดพลาด: ' + err.message)
    }
  }

  const renderImages = (type, images) =>
    images.map((src, i) => (
      <div
        key={i}
        className="inline-block m-2.5 relative border-2 border-[#ddd] rounded-[10px] overflow-hidden w-[120px] h-[120px] bg-[repeating-conic-gradient(#ddd_0%_25%,transparent_0%_50%)] [background-size:20px_20px]"
      >
        <img src={src} alt={`${type} ${i + 1}`} className="w-full h-full object-contain" />
        <button
          onClick={() => removeImage(type, i)}
          className="absolute top-[5px] right-[5px] bg-[#f44336] text-white border-none rounded-full w-[25px] h-[25px] cursor-pointer text-base leading-none"
        >×</button>
      </div>
    ))

  const field = (label, key, placeholder) => (
    <div className="flex flex-col gap-2 text-left">
      <label className="font-semibold text-[#333] text-sm">{label}</label>
      <input className={INPUT} value={form[key]} onChange={set(key)} placeholder={placeholder} />
    </div>
  )

  return (
    <div className="relative flex flex-col items-center h-[100dvh] overflow-y-auto overflow-x-hidden box-border p-5 text-center font-[Roboto,sans-serif]">
      {/* พื้นหลังไล่สีคงที่ (แทน body::before เดิม) */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#ebd09e] to-[#251f03]" />

      {client && (
        <div className="text-[13px] text-[#5a4a08] bg-white/75 border border-[#74640a] rounded-full px-4 py-1.5 mb-3">
          {client.clientName} · สัญญา {client.contractNo} · หมดอายุ {client.expiryDate}
        </div>
      )}

      <div className={`${CARD} mb-5`}>
        <h1 className="text-[#2c2503] text-2xl font-bold">สมาร์ทเช็ค</h1>
        <h3 className="text-[#2c2503] text-lg mt-2">กรอกข้อมูลกิจกรรม{editing ? ' (กำลังแก้ไข)' : ''}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px] my-5">
          {field('สัปดาห์ที่', 'week', 'ระบุสัปดาห์')}
          {field('สาระการเรียนรู้', 'topic', 'เช่น ภาษาไทย')}
          {field('หน่วยการเรียนรู้', 'unit', 'ระบุชื่อหน่วยการเรียนรู้')}
          {field('ครูผู้สอน', 'teacher', 'ชื่อครูผู้รับผิดชอบ')}
          <div className="flex flex-col gap-2 text-left">
            <label className="font-semibold text-[#333] text-sm">ระดับชั้น</label>
            <select className={INPUT} value={form.grade} onChange={set('grade')}>
              <option value="">-- เลือกระดับชั้น --</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {field('ห้อง', 'room', 'เช่น 1, 2, 3...')}
          {field('ชื่อผู้ทดสอบ', 'userName', 'ชื่อผู้ทดสอบ')}
        </div>
      </div>

      <div className={CARD}>
        <h3 className="text-[#2c2503] text-lg mt-10">เพิ่มรูปภาพ</h3>
        <input
          className="max-w-[500px] w-full text-lg p-3 rounded-[15px] mb-5 bg-white border-2 border-[#ccc] text-[#333] mx-auto"
          value={form.mainTopic} onChange={set('mainTopic')}
          placeholder="หัวข้อกิจกรรม/หมวดหมู่"
        />
        <div className="flex flex-col md:flex-row gap-3 justify-center mt-5">
          <div className="flex-1 md:max-w-[calc(50%-12px)] p-3 rounded-[10px] text-center box-border bg-[rgba(76,175,80,0.1)] border-2 border-[#4CAF50]">
            <label className="text-[#4CAF50] font-bold">รูปที่ถูกต้อง ✅</label><br />
            <label className="inline-block cursor-pointer rounded-lg font-medium text-[11px] px-2.5 py-[5px] mt-3 bg-[#fffdfd] text-[#4CAF50] border-2 border-[#4CAF50] transition">
              เลือกภาพ
              <input type="file" accept="image/*" onChange={handleUpload('correct')} className="hidden" />
            </label>
            <div className="mt-2.5">{renderImages('correct', correctImages)}</div>
          </div>
          <div className="flex-1 md:max-w-[calc(50%-12px)] p-3 rounded-[10px] text-center box-border bg-[rgba(244,67,54,0.1)] border-2 border-[#f44336]">
            <label className="text-[#f44336] font-bold">รูปที่ผิด ❌</label><br />
            <label className="inline-block cursor-pointer rounded-lg font-medium text-[11px] px-2.5 py-[5px] mt-3 bg-white text-[#f44336] border-2 border-[#f44336] transition">
              เลือกภาพ
              <input type="file" accept="image/*" onChange={handleUpload('wrong')} className="hidden" />
            </label>
            <div className="mt-2.5">{renderImages('wrong', wrongImages)}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-[15px] my-5 mx-auto max-w-[900px] flex-wrap">
        <button className={NEON} onClick={saveConfig}>เริ่มกิจกรรม</button>
        <button className={NEON} onClick={saveActivity}>บันทึกกิจกรรม</button>
        <button className={NEON} onClick={loadActivity}>เลือกกิจกรรม</button>
        <button className={NEON} onClick={() => { window.location.href = '/student-reports.html' }}>ประวัติผู้ทดสอบ</button>
      </div>

      {/* Activity modal */}
      {modal && (
        <div className={OVERLAY} onClick={() => setModal(null)}>
          <div
            className="bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] p-[30px] rounded-[20px] max-w-[700px] w-[95%] max-h-[85vh] overflow-y-auto border-[5px] border-[#4CAF50] text-[#1b5e20]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="m-0 text-xl font-bold">☁️ เลือกกิจกรรมจากคลาวด์</h2>
              <button className="bg-[#e74c3c] text-white border-none rounded-full w-10 h-10 cursor-pointer text-xl" onClick={() => setModal(null)}>✖</button>
            </div>
            {modal.loading && <p className="text-center">⏳ กำลังโหลดจากคลาวด์...</p>}
            {modal.error && <p className="text-center text-red-600">❌ {modal.error}</p>}
            {modal.teacherMap && !openTeacher && (
              Object.keys(modal.teacherMap).length === 0
                ? <p className="text-center text-[#666]">ยังไม่มีกิจกรรมบนคลาวด์</p>
                : (
                  <>
                    <h3 className="mt-0 mb-4 text-[#2e7d32] font-bold">👩‍🏫 เลือกครู</h3>
                    <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                      {Object.keys(modal.teacherMap).map(t => (
                        <div key={t} onClick={() => setOpenTeacher(t)}
                          className="bg-white p-[15px] rounded-[10px] border-[3px] border-[#4CAF50] cursor-pointer hover:scale-[1.03] hover:shadow-lg transition">
                          <div className="text-lg font-bold text-[#1b5e20]">👤 {t}</div>
                          <div className="text-sm text-[#666] mt-1.5">{modal.teacherMap[t].length} กิจกรรม</div>
                        </div>
                      ))}
                    </div>
                  </>
                )
            )}
            {modal.teacherMap && openTeacher && (
              <>
                <div className="flex items-center mb-4 gap-2.5">
                  <button onClick={() => setOpenTeacher(null)} className="bg-[#607d8b] text-white border-none px-[15px] py-2 rounded cursor-pointer font-bold">&lt;</button>
                  <h3 className="m-0 text-[#2e7d32] font-bold">กิจกรรมของ {openTeacher}</h3>
                </div>
                <div className="grid gap-2.5">
                  {modal.teacherMap[openTeacher].map(a => (
                    <div key={a.activityId} className="bg-white p-[15px] rounded-[10px] border-[3px] border-[#4CAF50]">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="m-0 text-[#1b5e20] text-base font-bold">{a.name}</h4>
                          <p className="my-1 text-[13px] text-[#666]">หัวข้อ: {a.config?.mainTopic || '-'}</p>
                          <p className="my-1 text-[13px] text-[#666]">สัปดาห์: {a.config?.week || '-'}</p>
                          <p className="my-1 text-[13px] text-[#4CAF50] font-bold">รูปถูก: {a.config?.correctImages?.length || 0} / รูปผิด: {a.config?.wrongImages?.length || 0}</p>
                          <p className="my-1 text-[11px] text-[#999]">รหัส: {a.activityId}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => playActivity(a)} className="bg-[#4CAF50] text-white border-none px-3 py-2 rounded cursor-pointer text-[13px]">▶️ เล่น</button>
                          <button onClick={() => editActivity(openTeacher, a)} className="bg-[#2196F3] text-white border-none px-3 py-2 rounded cursor-pointer text-[13px]">✏️ แก้ไข</button>
                          <button onClick={() => deleteActivity(openTeacher, a.activityId)} className="bg-[#f44336] text-white border-none px-3 py-2 rounded cursor-pointer text-[13px]">🗑️ ลบ</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom alert */}
      {alertMsg && (
        <div className={OVERLAY} onClick={() => setAlertMsg(null)}>
          <div className="bg-white rounded-[15px] p-[30px] max-w-[400px] w-[90%] text-center shadow-[0_10px_40px_rgba(0,0,0,0.3)]" onClick={e => e.stopPropagation()}>
            <div className="text-lg text-[#333] mb-5 leading-relaxed" dangerouslySetInnerHTML={{ __html: alertMsg }} />
            <button onClick={() => setAlertMsg(null)} className="bg-gradient-to-br from-[#a67c52] to-[#8b6914] text-white border-none px-10 py-3 rounded-[25px] text-base cursor-pointer">ตกลง</button>
          </div>
        </div>
      )}
    </div>
  )
}
