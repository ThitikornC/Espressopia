# สถาปัตยกรรมระบบ Espressopia × Espresso (Huaroa Platform)

เอกสารนี้อธิบายการทำงานของ **ระบบเดิม** (`D:\Espresso Blank\Espresso` — repo `ThitikornC/Huaroa`)
และ **แผนการแปลงเป็น React + รวมร่างกับหน้าแผนที่ใหม่** (`espressopia-standalone`)
พร้อมการรองรับการสร้างเว็บต่อลูกค้าแต่ละที่ (provisioning)

> เป้าหมาย: โค้ดชุดเดียว → เสิร์ฟได้ทุกศูนย์ → เปลี่ยนได้แค่หน้าตา (frontend) โดยไม่แตะสมองกลาง (backend)

---

## 1. ภาพรวมระบบปัจจุบัน (Espresso Blank)

แพลตฟอร์มการศึกษาสำหรับศูนย์พัฒนาเด็กเล็ก / เทศบาล เป็นสถาปัตยกรรม **ลูกผสม (hybrid)**:

```
┌──────────────────────────────────────────────────────────────┐
│  server.js  (Express + Socket.io + MongoDB)  ~2,580 บรรทัด      │  ← สมองกลาง
│  • เสิร์ฟหน้า HTML ทุกหน้า (sendFile)                            │
│  • REST API ~70 endpoints (usage / students / settings / ...)  │
│  • WebSocket นับผู้ใช้ออนไลน์ realtime (clientCount)            │
│  • 🚀 Provisioning: สร้าง Environment ลูกค้าใหม่ผ่าน Railway API │
└──────────────────────────────────────────────────────────────┘
        │                                          │
        ▼                                          ▼
┌──────────────────────────┐          ┌────────────────────────────┐
│ หน้า HTML เดี่ยว (Vanilla)│          │ /studio (classroomv3-main) │
│ • menu.html (หน้าแรก "/") │          │ React 18 + TS + Vite       │
│ • gamemath/thai/picture   │          │ • เกมระบายสี (Konva)        │
│ • teacher* (ฝั่งครู)       │          │ • เกมจิ๊กซอว์ (react-dnd)    │
│ • bmi-dashboard           │          │ • เกมจับหมวดหมู่            │
│ • student-reports         │          │ • Zustand store            │
│ • catagoly / beatbox      │          │ basename="/studio/"        │
└──────────────────────────┘          └────────────────────────────┘
```

### Tech stack
| ชั้น | เทคโนโลยี |
|---|---|
| Backend | Node 18, Express 4, Socket.io 4, MongoDB 7, http-proxy-middleware |
| หน้าเก่า | HTML + Vanilla JS + CSS (เสิร์ฟตรงจาก Express) |
| /studio | React 18 + TypeScript + Vite + Konva + react-dnd + Zustand |
| Deploy | Railway (Docker) — `npm start` → `node server.js` |

### โครงสร้างหน้า/เส้นทาง (จาก server.js)
| Route | ไฟล์/ปลายทาง | หน้าที่ |
|---|---|---|
| `GET /` | `menu.html` | หน้าแรก (เมนูปุ่มเกม) — **เป้าหมายที่จะแทนด้วยแผนที่** |
| `GET /menu` | `menu.html` | เมนู |
| `GET /gamemath`,`/gamethai`,`/gamepicture` | `*.html` | เกมนักเรียน |
| `GET /teachermatch`,`/teacherthai`,`/teacherpicture` | `*.html` | ฝั่งครูตั้งโจทย์ |
| `GET /bmi-dashboard` | `bmi-dashboard.html` | แดชบอร์ด BMI |
| `GET /studio/*` | React SPA | เกมรุ่นใหม่ (build หรือ proxy Vite:5173) |

---

## 2. API หลักที่ frontend ใหม่ต้องใช้

### 2.1 Provisioning & client config (หัวใจของ "แต่ละที่")
- **`GET /api/client-config`** — คืนข้อมูลศูนย์ของ environment นั้น:
  ```json
  { "clientName", "runNumber", "contractNo", "installDate", "expiryDate" }
  ```
  ทุกค่ามาจาก env var (`CUSTOMER_NAME`, `CLIENT_*`) → **ไม่ฮาร์ดโค้ด**
- **`POST /api/provision-trial`** `{ companyName }` — สร้างเว็บลูกค้าใหม่อัตโนมัติ:
  1. คำนวณเลขรัน/สัญญา/วันติดตั้ง/วันหมดอายุ (+30 วัน, พ.ศ.)
  2. Railway `environmentCreate` จาก template env
  3. `variableCollectionUpsert` อัด `MONGODB_DB=db_<ชื่อ>`, `CUSTOMER_NAME`, `CLIENT_*`
  4. คืน URL เว็บใหม่ `https://<project>-client-<ชื่อ>-xxxx.up.railway.app`

### 2.2 Usage tracking (ป้อนแดชบอร์ดบนแผนที่)
| Endpoint | หน้าที่ |
|---|---|
| `POST /api/usage/start` / `/end` | จับเวลาเข้า-ออกหน้า (buffer→flush MongoDB), ออก cookie `huaroa_client_id` 365 วัน |
| `POST /api/usage/event` | บันทึก event ย่อยในหน้า |
| `GET /status/active-clients` | จำนวนคนออนไลน์ตอนนี้ |
| `GET /status/usage-by-page` / `daily-page-summary` | สถิติต่อหน้า/ต่อวัน |
| `GET /api/user-stats` | ยอดผู้ใช้รวม |
| Socket `clientCount` | นับ realtime ผ่าน heartbeat ทุก 10 วิ |

### 2.3 เนื้อหา/ผลการเรียน
`/api/students/*`, `/api/test-results/*`, `/api/settings/:mode`, `/api/game-results`,
`/api/activities/*`, `/api/bmi-record(s)` — ใช้ MongoDB (`mdb`, `bmiDb`)

> **คีย์ออกแบบ:** เว็บใหม่เป็นแค่ "เปลือกหน้าตา" ต่อ API/Socket เดิม → เปลี่ยนหน้าตาได้โดยไม่แตะ backend และ provisioning ต่อลูกค้ายังทำงานเหมือนเดิม

---

## 3. เวอร์ชันใหม่ (espressopia-standalone)

React + Vite + Tailwind — หน้าตาแผนที่ไอโซเมตริก "เกาะกาแฟ"

| ไฟล์ | หน้าที่ |
|---|---|
| `App.jsx` | Router: `/`=WorldMap, `/town`=Espressopia, `/Huaroi`=Dashboard |
| `WorldMap.jsx` | แผนที่โลก 5 เกาะ (สัตว์=ศูนย์) คลิกเข้าแต่ละที่ + แดชบอร์ดสถิติด้านล่าง |
| `Espressopia.jsx` | เมืองไอโซเมตริก (honeycomb tiles + sprite) |
| `Huaroi.jsx` | หน้าแดชบอร์ดเต็ม (มี `fetch('/api/cameras')` ผ่าน gateway แล้ว) |
| `StatsCards.jsx` | 3 การ์ด: อันดับการใช้ · เกจ · โพเดียม |
| `Marathon.jsx` | เลนวิ่งจัดอันดับตาม count |
| `centersData.js` | ข้อมูล 5 ศูนย์ (ปัจจุบัน **hardcode** — ต้องเปลี่ยนเป็นดึง API) |
| `sprites.jsx` | เครื่องมือ sprite animation ทั้งหมด |

**สถานะปัจจุบัน:** ข้อมูล (`CENTERS`, `count`) เป็นค่าคงที่ → ขั้นถัดไปต้องต่อ API จริง

---

## 4. แผนรวมร่าง (Migration → React-first)

### กลยุทธ์: "Strangler Pattern" — ค่อย ๆ แทนทีละหน้า ไม่ rewrite ทีเดียว

```
ระยะที่ 1  espressopia build → เสิร์ฟเป็นหน้าแรก "/" แทน menu.html
ระยะที่ 2  ต่อ API จริง (client-config + usage) เข้าแผนที่/แดชบอร์ด
ระยะที่ 3  ย้ายหน้าเกม/ครูทีละหน้าเข้า React (หรือคง HTML ไว้ก่อน ลิงก์จากแผนที่)
ระยะที่ 4  รวมเป็น SPA เดียว, backend เหลือหน้าที่ API + provisioning ล้วน
```

### ระยะที่ 1 — เอาแผนที่ใหม่แทน menu.html

**ทางเลือก A (แนะนำ, เร็ว):** build แผนที่เป็น static แล้วให้ Express เสิร์ฟ
1. `cd espressopia-standalone && npm run build` → ได้ `dist/`
2. ใน `server.js` เปลี่ยน base path ของ vite ให้รองรับ root (ตั้ง `base: '/'`)
3. คัดลอก `dist/` ไปวางในระบบเก่า แล้วแก้ route:
   ```js
   // เดิม: app.get("/", (req,res)=>res.sendFile("menu.html"))
   app.use(express.static(path.join(__dirname, "espressopia-dist")))
   app.get("/", (req,res)=>res.sendFile(path.join(__dirname,"espressopia-dist","index.html")))
   ```
4. เก็บ `menu.html` ไว้ที่ `/menu-legacy` เผื่อ fallback
5. ปุ่มในแผนที่ลิงก์ไปหน้าเกมเดิม (`/gamemath`, `/studio` ฯลฯ) ได้ทันที

**ทางเลือก B:** ผูก build เข้า pipeline เดียว — เพิ่มใน `package.json` ระบบเก่า:
```json
"build": "cd classroomv3-main && npm i && npm run build && cd ../espressopia-standalone && npm i && npm run build"
```

### ระยะที่ 2 — ต่อ API จริง

แทน `centersData.js` (hardcode) ด้วยข้อมูลจริง:

1. **client-config** — สร้าง hook ใหม่:
   ```js
   // useClientConfig.js
   export function useClientConfig() {
     const [cfg, setCfg] = useState(null)
     useEffect(() => {
       fetch('/api/client-config').then(r=>r.json()).then(setCfg).catch(()=>{})
     }, [])
     return cfg  // { clientName, runNumber, contractNo, installDate, expiryDate }
   }
   ```
2. **usage tracking** — เพิ่ม `/api/usage/start` ตอน mount + `/end` ตอน unmount (ตาม pattern ของ `classroomv3-main/src/hooks/useUsageTracking.ts`)
3. **สถิติแดชบอร์ด** — ดึง `/status/usage-by-page` / `/api/user-stats` มาแทน `count` คงที่ใน `StatsCards`/`Marathon`
4. **คนออนไลน์ realtime** — ต่อ socket.io-client ฟัง `clientCount`

> ตอน dev: ตั้ง Vite proxy ให้ `/api` และ `/status` และ `/socket.io` ชี้ไป `http://localhost:3000` (server.js)

---

## 5. รองรับ Provisioning ต่อที่บนแผนที่

ให้แผนที่ "รู้ตัว" ว่ากำลังเสิร์ฟศูนย์ไหน โดยอ่าน `/api/client-config`:

1. แสดง **ชื่อศูนย์** (`clientName`) เป็นหัวเรื่องแทนที่ "เทศบาลตำบลหัวรอ" ที่ hardcode ใน `WorldMap.jsx`/`Huaroi.jsx`
2. แสดง **แบนเนอร์วันหมดอายุ** (`expiryDate`) มุมจอ + เตือนเมื่อใกล้หมด:
   ```jsx
   const cfg = useClientConfig()
   {cfg && <div className="expiry-badge">
     {cfg.clientName} · สัญญา {cfg.contractNo} · หมดอายุ {cfg.expiryDate}
   </div>}
   ```
3. **โหมด demo vs ลูกค้าจริง** — ถ้า `clientName==='Demo User'` แสดงป้าย "ทดลองใช้"
4. (ออปชัน) หน้า admin เรียก `POST /api/provision-trial` เพื่อปั๊มเว็บใหม่จากในแอป

> หลักการ: หน้าตาเดียวกันทุกที่ ความต่างมาจาก env var ฝั่ง server เท่านั้น → ข้อมูลแต่ละศูนย์แยกด้วย `MONGODB_DB` ของ environment นั้น

---

## 6. สิ่งที่ต้องระวัง (Gotchas)

- **base path**: espressopia ใช้ `import.meta.env.BASE_URL` อยู่แล้ว — ตั้ง `base` ใน vite.config ให้ตรงตำแหน่งที่เสิร์ฟ (`/` หรือ `/app/`)
- **SPA fallback**: ถ้าใช้ react-router ต้องให้ Express ตอบ index.html สำหรับ route ที่ไม่ใช่ไฟล์ (เหมือนที่ `/studio/*` ทำ)
- **CORS/cookie**: `huaroa_client_id` เป็น HttpOnly cookie — ใช้ same-origin จึงต้องเสิร์ฟ frontend จาก domain เดียวกับ API (อย่าแยก host) หรือเปิด CORS+credentials
- **assets ใหญ่**: แผนที่/sprite เป็น webp/png ขนาดใหญ่ — preload เฉพาะที่จำเป็น
- **MIME**: เลียนแบบ logic ของ `/studio/*` ที่กัน HTML ไม่ให้ตอบแทนไฟล์ .js/.css

---

## 7. Roadmap สรุป

- [ ] **R1** ตั้ง vite proxy (`/api`,`/status`,`/socket.io`) ใน espressopia สำหรับ dev
- [ ] **R2** สร้าง `useClientConfig` + แสดงชื่อศูนย์/วันหมดอายุบนแผนที่
- [ ] **R3** สร้าง `useUsageTracking` (start/end) ในเวอร์ชันใหม่
- [ ] **R4** เปลี่ยน `centersData`/`StatsCards`/`Marathon` ให้ดึงสถิติจริง
- [ ] **R5** build espressopia แล้วตั้งเป็นหน้า `/` แทน `menu.html` (เก็บของเดิมที่ `/menu-legacy`)
- [ ] **R6** ลิงก์ปุ่มบนแผนที่ → หน้าเกม/ครูเดิม (`/studio`, `/gamemath`, ...)
- [ ] **R7** (ภายหลัง) ย้ายหน้าเกม/ครู เข้า React ทีละหน้า
