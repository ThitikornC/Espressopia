import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Espressopia from './Espressopia.jsx'
import LayerGreedy from './Huaroi.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Espressopia />} />
        <Route path="/Huaroi" element={<LayerGreedy />} />
      </Routes>
    </BrowserRouter>
  )
}
