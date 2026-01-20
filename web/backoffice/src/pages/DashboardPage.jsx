import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { iconByType } from '../mapIcons'
import './DashboardPage.css'

const events = [
  { id: 1, type: 'danger', title: 'Incident', lat: -18.913, lon: 47.520, description: 'Accident sur la RN7' },
  { id: 2, type: 'works', title: 'Travaux', lat: -18.910, lon: 47.535, description: 'Réfection du revêtement' },
  { id: 3, type: 'warning', title: 'Risque', lat: -18.905, lon: 47.545, description: 'Signalisation défectueuse' },
  { id: 4, type: 'water', title: 'Inondation', lat: -18.920, lon: 47.530, description: 'Débordement à Analakely' },
  { id: 5, type: 'ok', title: 'Validation', lat: -18.907, lon: 47.525, description: 'Zone stabilisée' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Backoffice - Suivi des travaux routiers</h1>
        <div className="header-actions">
          {role === 'manager' && (
            <button onClick={() => navigate('/users')} className="logout-button">
              Gestion Utilisateurs
            </button>
          )}
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      </header>
      <div className="map-root">
        <MapContainer center={[-18.91, 47.52]} zoom={13} className="map-inner" scrollWheelZoom>
          <TileLayer url="http://localhost:8081/styles/basic-preview/512/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />

          {events.map((event) => (
            <Marker key={event.id} position={[event.lat, event.lon]} icon={iconByType[event.type]}>
              <Popup>
                <strong>{event.title}</strong>
                <p>{event.description}</p>
                <small>Type : {event.type}</small>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
