import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { iconByType } from '../mapIcons'

export function MapView({ events }) {
  return (
    <MapContainer center={[-18.91, 47.52]} zoom={13} className="map-inner" scrollWheelZoom>
      <TileLayer
        url="http://localhost:8089/styles/basic-preview/512/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {events.map((event) => {
        const icon = iconByType[event.icon_key] || iconByType.warning
        const entreprise = event.detail_problem.entreprise_assign
        return (
          <Marker key={event.id} position={[event.lat, event.lon]} icon={icon}>
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
                <li>Entreprise : {entreprise?.name ?? 'Non attribué'}</li>
              </ul>
              <Link
                to={`/signalements/${event.id}/photos`}
                style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '8px 15px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                Voir les photos
              </Link>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

MapView.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      type_problem: PropTypes.string.isRequired,
      illustration_problem: PropTypes.string.isRequired,
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
      icon_key: PropTypes.string.isRequired,
      detail_problem: PropTypes.shape({
        etat: PropTypes.string.isRequired,
        date_problem: PropTypes.string.isRequired,
        surface_m2: PropTypes.number.isRequired,
        budget: PropTypes.number.isRequired,
        entreprise_assign: PropTypes.shape({
          id: PropTypes.number,
          name: PropTypes.string,
        }),
        description: PropTypes.string.isRequired,
      }).isRequired,
    })
  ).isRequired,
}
