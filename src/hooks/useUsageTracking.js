import { useEffect, useRef } from 'react'

/* บันทึกการใช้งานหน้า (port จากระบบเก่า /api/usage/start|end)
   - mount  → POST /api/usage/start  เก็บ usageId
   - unmount/ออกจากหน้า → POST /api/usage/end
   credentials:'include' เพื่อให้ cookie huaroa_client_id ถูกส่ง/รับ (ต้อง same-origin) */
export function useUsageTracking(page, section) {
  const usageIdRef = useRef(null)
  const endedRef = useRef(false)

  useEffect(() => {
    let active = true
    endedRef.current = false

    fetch('/api/usage/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ page, section }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (active && d) usageIdRef.current = d.usageId })
      .catch(() => {})

    const buildBody = () => JSON.stringify({ usageId: usageIdRef.current, page, section })

    // ออกจากแท็บ/ปิดหน้า — ใช้ sendBeacon ให้ส่งทันก่อนหน้าโดนทำลาย
    const onUnload = () => {
      if (endedRef.current || !usageIdRef.current) return
      endedRef.current = true
      try {
        navigator.sendBeacon?.(
          '/api/usage/end',
          new Blob([buildBody()], { type: 'application/json' })
        )
      } catch { /* ignore */ }
    }
    window.addEventListener('beforeunload', onUnload)

    return () => {
      active = false
      window.removeEventListener('beforeunload', onUnload)
      // เปลี่ยน route ภายใน SPA — ปิด session ปกติ
      if (!endedRef.current && usageIdRef.current) {
        endedRef.current = true
        fetch('/api/usage/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: buildBody(),
        }).catch(() => {})
      }
    }
  }, [page, section])
}
