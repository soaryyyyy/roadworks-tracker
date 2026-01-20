import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { iconByType } from '../mapIcons'

export function MapView({ events }) {
  return (
    <MapContainer center={[-18.91, 47.52]} zoom={13} className="map-inner" scrollWheelZoom>
      <TileLayer url="http://localhost:8081/styles/basic-preview/512/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />

      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lon]}
          icon={iconByType[event.type_problem]}
        >
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
  )
}
