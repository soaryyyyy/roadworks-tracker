import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { iconByType } from './mapIcons'
import './App.css'

const events = [
  {
    id: 1,
    type_problem: 'accident_routier',
    illustration_problem: '⛔',
    lat: -18.913,
    lon: 47.52,
    detail_problem: {
      etat: 'nouveau',
      date_problem: '2026-01-15T08:00:00Z',
      surface_m2: 90.3,
      budget: 95000,
      entreprise_assign: { id: 1, name: 'BTP Antananarivo' },
      description: 'Accident avec sortie de route et debris sur la RN7.',
    },
  },
  {
    id: 2,
    type_problem: 'travaux_routier',
    illustration_problem: '🚧',
    lat: -18.91,
    lon: 47.535,
    detail_problem: {
      etat: 'en_cours',
      date_problem: '2026-01-10T10:00:00Z',
      surface_m2: 260,
      budget: 280000,
      entreprise_assign: { id: 2, name: 'Reseaux Urbains' },
      description: 'Travaux de remise en etat du reseau d\'eau potable.',
    },
  },
  {
    id: 3,
    type_problem: 'montee_d_eau',
    illustration_problem: '💧',
    lat: -18.905,
    lon: 47.545,
    detail_problem: {
      etat: 'en_cours',
      date_problem: '2026-01-18T09:00:00Z',
      surface_m2: 150,
      budget: 180000,
      entreprise_assign: { id: 3, name: 'Réseau Fluvial' },
      description: 'Monte d\'eau suite aux fortes pluies, quartier Analakely.',
    },
  },
  {
    id: 4,
    type_problem: 'route_fermee',
    illustration_problem: '🚫',
    lat: -18.907,
    lon: 47.525,
    detail_problem: {
      etat: 'termine',
      date_problem: '2026-01-02T10:00:00Z',
      surface_m2: 200,
      budget: 215000,
      entreprise_assign: { id: 2, name: 'Reseaux Urbains' },
      description: 'Route ferme pour reseau de gaz, detour mis en place.',
    },
  },
  {
    id: 5,
    type_problem: 'danger',
    illustration_problem: '⚠️',
    lat: -18.903,
    lon: 47.515,
    detail_problem: {
      etat: 'nouveau',
      date_problem: '2026-01-20T12:00:00Z',
      surface_m2: 70,
      budget: 60000,
      entreprise_assign: { id: 1, name: 'BTP Antananarivo' },
      description: 'Danger de fissures sur la rive du lac Anosy.',
    },
  },
  {
    id: 6,
    type_problem: 'warning',
    illustration_problem: '⚠️',
    lat: -18.91,
    lon: 47.51,
    detail_problem: {
      etat: 'en_cours',
      date_problem: '2026-01-21T15:00:00Z',
      surface_m2: 30,
      budget: 40000,
      entreprise_assign: { id: 3, name: 'Réseau Fluvial' },
      description: 'Warning sur la signalisation au carrefour Bellonte.',
    },
  },
]

export default function App() {
  return (
    <div className="map-root">
      <MapContainer center={[-18.91, 47.52]} zoom={13} className="map-inner" scrollWheelZoom>
        <TileLayer url="http://localhost:8081/styles/basic-preview/512/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />

        {events.map((event) => (
          <Marker key={event.id} position={[event.lat, event.lon]} icon={iconByType[event.type_problem]}>
            <Popup>
              <strong>
                {event.illustration_problem} {event.type_problem.replace(/_/g, ' ')}
              </strong>
              <p>{event.detail_problem.description}</p>
              <ul>
                <li>Status : {event.detail_problem.etat}</li>
                <li>Date : {new Date(event.detail_problem.date_problem).toLocaleString()}</li>
                <li>Surface : {event.detail_problem.surface_m2} m²</li>
                <li>Budget : {event.detail_problem.budget.toLocaleString()} Ar</li>
                <li>Entreprise : {event.detail_problem.entreprise_assign.name}</li>
              </ul>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
