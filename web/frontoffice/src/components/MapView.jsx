import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { iconByType } from '../mapIcons'
import './MapView.css'

const normalizeText = (value = '') =>
  `${value ?? ''}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const statusTone = (status) => {
  const s = normalizeText(status)
  if (!s) return 'neutral'
  if (s.includes('termine')) return 'success'
  if (s.includes('en_cours') || s.includes('en cours') || s.includes('progress')) return 'warning'
  if (s.includes('nouveau') || s.includes('new')) return 'info'
  if (s.includes('inconnu') || s.includes('unknown')) return 'neutral'
  return 'neutral'
}

function MarkersLayer({ events }) {
  const map = useMap()

  return (
    <>
      {events.map((event) => {
        const icon = iconByType[event.icon_key] || iconByType.warning
        const entreprise = event.detail_problem.entreprise_assign
        const status = event.detail_problem.etat
        const tone = statusTone(status)

        return (
          <Marker key={event.id} position={[event.lat, event.lon]} icon={icon}>
            <Popup>
              <article className="rw-popup">
                <header className="rw-popup__header">
                  <div className="rw-popup__title">
                    <span className="rw-popup__emoji">{event.illustration_problem}</span>
                    <span>{event.type_problem.replace(/_/g, ' ')}</span>
                  </div>
                  <span className={`rw-badge rw-badge--${tone}`}>{status}</span>
                </header>

                <p className="rw-popup__desc">{event.detail_problem.description}</p>

                <dl className="rw-popup__meta">
                  <div>
                    <dt>Date</dt>
                    <dd>{new Date(event.detail_problem.date_problem).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Surface</dt>
                    <dd>{event.detail_problem.surface_m2} m²</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>{event.detail_problem.budget.toLocaleString()} Ar</dd>
                  </div>
                  <div>
                    <dt>Entreprise</dt>
                    <dd>{entreprise?.name ?? 'Non attribué'}</dd>
                  </div>
                </dl>

                <div className="rw-popup__actions">
                  <Link to={`/signalements/${event.id}/photos`} className="rw-popup__btn">
                    Voir les photos
                  </Link>
                  <button
                    type="button"
                    className="rw-popup__btn rw-popup__btn--ghost"
                    onClick={() => {
                      const targetZoom = Math.max(map.getZoom(), 17)
                      map.setView([event.lat, event.lon], targetZoom, { animate: true })
                    }}
                  >
                    Zoom auto
                  </button>
                </div>
              </article>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

MarkersLayer.propTypes = {
  events: PropTypes.array.isRequired,
}

export function MapView({ events }) {
  return (
    <div className="map-view">
      <MapContainer center={[-18.91, 47.52]} zoom={13} className="map-inner" scrollWheelZoom>
        <TileLayer
          url="http://localhost:8089/styles/basic-preview/512/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <MarkersLayer events={events} />
      </MapContainer>
    </div>
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
