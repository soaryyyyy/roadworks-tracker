import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MapPage from './pages/MapPage'
import PhotosPage from './pages/PhotosPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/signalements/:id/photos" element={<PhotosPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
