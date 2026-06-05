import { useState, useEffect } from 'react'

/* อ่านข้อมูลศูนย์ของ environment นี้จาก /api/client-config
   ใช้แสดงชื่อศูนย์ / เลขสัญญา / วันหมดอายุ บนทุกหน้า (รองรับ provisioning ต่อที่)
   คืน null ระหว่างโหลดหรือถ้า API ไม่พร้อม */
export function useClientConfig() {
  const [cfg, setCfg] = useState(null)
  useEffect(() => {
    let active = true
    fetch('/api/client-config', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (active) setCfg(d) })
      .catch(() => {})
    return () => { active = false }
  }, [])
  return cfg
}
