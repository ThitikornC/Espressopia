import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WorldMap from './WorldMap.jsx'
import Espressopia from './Espressopia.jsx'
import LayerGreedy from './Huaroi.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorldMap />} />
        <Route path="/town" element={<Espressopia />} />
        <Route path="/Huaroi" element={<LayerGreedy />} />
      </Routes>
    </BrowserRouter>
  )
}
