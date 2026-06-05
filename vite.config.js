import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // ส่งต่อ API/Socket + หน้า/asset ของ legacy ไป backend เดิม (server.js) ตอน dev
    // ตั้ง VITE_BACKEND ใน .env ได้ ถ้า backend อยู่ host อื่น
    proxy: (() => {
      const target = process.env.VITE_BACKEND || 'http://localhost:3000'
      const p = (extra = {}) => ({ target, changeOrigin: true, ...extra })
      return {
        '/api': p(),
        '/status': p(),
        '/socket.io': p({ ws: true }),
        '/socket-client.js': p(),
        // โฟลเดอร์ asset ของหน้า legacy (ไม่ชนกับ /assets ของ espressopia)
        '/js': p(),
        '/css': p(),
        '/uploads': p(),
        '/picture': p(),
        '/Sound': p(),
        '/video': p(),
        // หน้า .html เดิมที่ยังไม่แปลงเป็น React
        // หมายเหตุ: gamepicture/teacherpicture แปลงเป็น React แล้ว จึงไม่ proxy (ปล่อยให้ SPA จัดการ)
        '^/(gamemath|gamethai|gamewrite|gamecount|gamedialog|beatbox|teachermatch|teacherthai|bmi-dashboard|student-reports|admin-usage|BMI)\\.html': p(),
      }
    })(),
  },
  preview: {
    port: parseInt(process.env.PORT) || 4173,
    host: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
  },
})
