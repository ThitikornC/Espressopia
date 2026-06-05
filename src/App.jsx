import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import WorldMap from './WorldMap.jsx'
import Espressopia from './Espressopia.jsx'
import LayerGreedy from './Huaroi.jsx'
import TeacherPicture from './pages/TeacherPicture.jsx'
import GamePicture from './pages/GamePicture.jsx'
import Menu from './pages/Menu.jsx'
import Catagoly from './pages/Catagoly.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorldMap />} />
        <Route path="/town" element={<Espressopia />} />
        <Route path="/Huaroi" element={<LayerGreedy />} />
        <Route path="/teacherpicture" element={<TeacherPicture />} />
        <Route path="/gamepicture" element={<GamePicture />} />
        {/* รองรับลิงก์เก่า .html ที่ค้างใน cache → เด้งไป route React */}
        <Route path="/gamepicture.html" element={<Navigate to="/gamepicture" replace />} />
        <Route path="/teacherpicture.html" element={<Navigate to="/teacherpicture" replace />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/menu.html" element={<Navigate to="/menu" replace />} />
        <Route path="/catagoly" element={<Catagoly />} />
        <Route path="/catagoly.html" element={<Navigate to="/catagoly" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
