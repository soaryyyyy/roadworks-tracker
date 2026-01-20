import { useState } from 'react'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { MapView } from './components/MapView'
import { DashboardView } from './components/DashboardView'

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
      entreprise_assign: { id: 3, name: 'Reseau Fluvial' },
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
      description: 'Route fermee pour reseau de gaz, detour mis en place.',
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
      entreprise_assign: { id: 3, name: 'Reseau Fluvial' },
      description: 'Warning sur la signalisation au carrefour Bellonte.',
    },
  },
]

const views = [
  { key: 'map', label: 'Carte' },
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'list', label: 'Liste' },
]

export default function App() {
  const [activeView, setActiveView] = useState('map')

  const renderView = () => {
    if (activeView === 'map') {
      return <MapView events={events} />
    }

    if (activeView === 'dashboard') {
      return <DashboardView events={events} />
    }

    return (
      <section className="list-view">
        <h2>Liste detaillee</h2>
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.illustration_problem} {event.type_problem.replace(/_/g, ' ')}</strong>
              <p>{event.detail_problem.description}</p>
              <small>
                Etat: {event.detail_problem.etat} · Budget: {event.detail_problem.budget} Ar
              </small>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Roadworks Tracker</p>
          <h1>Suivi des incidents et travaux</h1>
        </div>
        <nav className="view-nav">
          {views.map((view) => (
            <button
              key={view.key}
              className={activeView === view.key ? 'active' : ''}
              onClick={() => setActiveView(view.key)}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">{renderView()}</main>
    </div>
  )
}
