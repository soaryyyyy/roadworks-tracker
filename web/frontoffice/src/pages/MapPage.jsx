import { useEffect, useMemo, useState } from 'react'
import { MapView } from '../components/MapView'
import { DashboardView } from '../components/DashboardView'
import DatePickerInput from '../components/DatePickerInput'
import logo from '../assets/logo.png'
import './MapPage.css'

const locationCoordinates = {
  Analakely: { lat: -18.913, lon: 47.52 },
  Isoraka: { lat: -18.91, lon: 47.535 },
  'Lac Anosy': { lat: -18.91, lon: 47.51 },
}

const iconTypeMap = {
  incident: 'danger',
  travaux: 'travaux_routier',
  'travaux routier': 'travaux_routier',
  danger: 'danger',
  warning: 'warning',
  'montee d eau': 'montee_d_eau',
  'route fermee': 'route_fermee',
  'accident routier': 'accident_routier',
}

const views = [
  { key: 'map', label: 'Carte' },
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'list', label: 'Liste' },
]

const defaultCoords = { lat: -18.91, lon: 47.52 }
const defaultFilters = {
  status: '',
  dateFrom: null,
  dateTo: null,
  surfaceMin: '',
  surfaceMax: '',
  budgetMin: '',
  budgetMax: '',
  entreprise: '',
}

const parseCoordsFromLocation = (location) => {
  if (!location || typeof location !== 'string') return null
  const parts = location.split(',').map((part) => part.trim())
  if (parts.length !== 2) return null

  const lat = Number(parts[0])
  const lon = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  return { lat, lon }
}

const slugify = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')

const normalizeText = (value = '') =>
  `${value ?? ''}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const mapTypeKey = (typeProblem) => {
  if (!typeProblem) return 'warning'
  const normalized = typeProblem.trim().toLowerCase()
  return iconTypeMap[normalized] || slugify(typeProblem) || 'warning'
}

const mapCoords = (location) =>
  parseCoordsFromLocation(location) || locationCoordinates[location] || defaultCoords

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

const parseDateInput = (value, endOfDay = false) => {
  if (!value) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    const date = new Date(value)
    if (endOfDay) {
      date.setHours(23, 59, 59, 999)
    } else {
      date.setHours(0, 0, 0, 0)
    }
    return date
  }
  if (typeof value === 'string') {
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return null
    return new Date(
      year,
      month - 1,
      day,
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    )
  }
  return null
}

const normalizeRange = (minValue, maxValue) => {
  if (minValue === null || maxValue === null) return [minValue, maxValue]
  return minValue <= maxValue ? [minValue, maxValue] : [maxValue, minValue]
}

const uniqueByNormalizedValue = (values) => {
  const items = new Map()
  values.forEach((value) => {
    if (!value) return
    const normalized = normalizeText(value)
    if (!normalized || items.has(normalized)) return
    items.set(normalized, value)
  })
  return Array.from(items.values()).sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  )
}

const adaptDtoToEvent = (dto) => {
  const detail = dto.detail ?? {}
  const coords = mapCoords(dto.location)

  return {
    id: dto.id,
    type_problem: dto.typeProblem || 'incident',
    illustration_problem: dto.illustrationProblem || '📍',
    icon_key: mapTypeKey(dto.typeProblem),
    lat: coords.lat,
    lon: coords.lon,
    detail_problem: {
      etat: detail.etat || 'inconnu',
      date_problem: detail.dateProblem ?? new Date().toISOString(),
      surface_m2: Number(detail.surfaceM2 ?? 0),
      budget: Number(detail.budget ?? 0),
      entreprise_assign: detail.entrepriseAssign ?? { id: null, name: '—' },
      description: detail.description ?? 'Aucune description disponible.',
    },
  }
}

export function MapPage() {
  const [activeView, setActiveView] = useState('map')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ ...defaultFilters })
  const [showFilters, setShowFilters] = useState(true)
  const [showEntrepriseSuggestions, setShowEntrepriseSuggestions] = useState(false)
  const [showStatusOptions, setShowStatusOptions] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('http://localhost:8080/api/signalements')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Impossible de récupérer les signalements.')
        }
        return response.json()
      })
      .then((data) => {
        setEvents(data.map(adaptDtoToEvent))
        setError(null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const statusOptions = useMemo(
    () => uniqueByNormalizedValue(events.map((event) => event.detail_problem.etat)),
    [events]
  )

  const entrepriseOptions = useMemo(
    () =>
      uniqueByNormalizedValue(
        events
          .map((event) => event.detail_problem.entreprise_assign?.name)
          .filter((name) => name && name !== '—')
      ),
    [events]
  )

  const entrepriseSuggestions = useMemo(() => {
    const query = normalizeText(filters.entreprise)
    const matches = entrepriseOptions.filter((option) => {
      if (!query) return true
      return normalizeText(option).includes(query)
    })
    return matches.slice(0, 8)
  }, [entrepriseOptions, filters.entreprise])

  const statusChoices = useMemo(() => [''].concat(statusOptions), [statusOptions])
  const statusLabel = (value) => (value ? value : 'Tous')

  const filteredEvents = useMemo(() => {
    const statusFilter = normalizeText(filters.status)
    const entrepriseFilter = normalizeText(filters.entreprise)
    const [surfaceMin, surfaceMax] = normalizeRange(
      parseNumber(filters.surfaceMin),
      parseNumber(filters.surfaceMax)
    )
    const [budgetMin, budgetMax] = normalizeRange(
      parseNumber(filters.budgetMin),
      parseNumber(filters.budgetMax)
    )
    const dateFrom = parseDateInput(filters.dateFrom)
    const dateTo = parseDateInput(filters.dateTo, true)
    const [startDate, endDate] =
      dateFrom && dateTo && dateFrom > dateTo ? [dateTo, dateFrom] : [dateFrom, dateTo]

    return events.filter((event) => {
      const detail = event.detail_problem
      const statusValue = normalizeText(detail.etat)
      if (statusFilter && statusValue !== statusFilter) return false

      if (entrepriseFilter) {
        const entrepriseValue = normalizeText(detail.entreprise_assign?.name ?? '')
        if (!entrepriseValue.includes(entrepriseFilter)) return false
      }

      if (surfaceMin !== null && detail.surface_m2 < surfaceMin) return false
      if (surfaceMax !== null && detail.surface_m2 > surfaceMax) return false

      if (budgetMin !== null && detail.budget < budgetMin) return false
      if (budgetMax !== null && detail.budget > budgetMax) return false

      if (startDate || endDate) {
        const eventDate = new Date(detail.date_problem)
        const eventTime = eventDate.getTime()
        if (Number.isNaN(eventTime)) return false
        if (startDate && eventTime < startDate.getTime()) return false
        if (endDate && eventTime > endDate.getTime()) return false
      }

      return true
    })
  }, [events, filters])

  const handleFilterChange = (key) => (event) => {
    const { value } = event.target
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ ...defaultFilters })
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== '' && value !== null)

  const handleEntrepriseSelect = (value) => {
    setFilters((prev) => ({ ...prev, entreprise: value }))
    setShowEntrepriseSuggestions(false)
  }

  const handleStatusSelect = (value) => {
    setFilters((prev) => ({ ...prev, status: value }))
    setShowStatusOptions(false)
  }

  const renderView = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement des signalements…</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error">{error}</div>
        </div>
      )
    }

    if (activeView === 'map') {
      return <MapView events={filteredEvents} />
    }

    if (activeView === 'dashboard') {
      return <DashboardView events={filteredEvents} />
    }

    return (
      <section className="list-view">
        <h2>Liste détaillée</h2>
        {filteredEvents.length === 0 ? (
          <p>Aucun signalement ne correspond à ces filtres.</p>
        ) : (
          <ul>
            {filteredEvents.map((event) => (
              <li key={event.id}>
                <strong>
                  {event.illustration_problem} {event.type_problem.replace(/_/g, ' ')}
                </strong>
                <p>{event.detail_problem.description}</p>
                <small>
                  <span><strong>Etat:</strong> {event.detail_problem.etat}</span>
                  <span><strong>Budget:</strong> {event.detail_problem.budget.toLocaleString()} Ar</span>
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <img src={logo} alt="Roadworks Tracker" className="app-logo" />
          <div>
            <p className="eyebrow">Roadworks Tracker</p>
            <h1>Suivi des incidents et travaux</h1>
          </div>
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
      <main className="app-main">
        <div className="content-stack">
          <section className="filters-bar">
            <div className={`filters-panel ${showFilters ? '' : 'is-collapsed'}`}>
              <div className="filters-header">
                <h2>Filtres</h2>
                <div className="filters-header-actions">
                  <span className="filters-count">
                    {filteredEvents.length} signalement{filteredEvents.length > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    className="filters-toggle"
                    onClick={() => setShowFilters((prev) => !prev)}
                    aria-expanded={showFilters}
                  >
                    {showFilters ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>
              {showFilters && (
                <>
                  <div className="filters-grid">
                    <div className="filter-field filter-field--status">
                      <label htmlFor="filter-status">Statut</label>
                      <div className="autocomplete autocomplete--select">
                        <input
                          id="filter-status"
                          value={statusLabel(filters.status)}
                          readOnly
                          onFocus={() => {
                            setShowStatusOptions(true)
                            setShowEntrepriseSuggestions(false)
                          }}
                          onClick={() => setShowStatusOptions((prev) => !prev)}
                          onBlur={() => setShowStatusOptions(false)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              setShowStatusOptions(false)
                            }
                          }}
                          aria-autocomplete="list"
                          aria-expanded={showStatusOptions}
                        />
                        <span className="autocomplete-caret" aria-hidden="true" />
                        {showStatusOptions && (
                          <div className="autocomplete-list" role="listbox">
                            {statusChoices.map((status) => (
                              <button
                                key={status || 'all'}
                                type="button"
                                className="autocomplete-item"
                                role="option"
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  handleStatusSelect(status)
                                }}
                              >
                                {statusLabel(status)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="filter-field filter-field--entreprise">
                      <label htmlFor="filter-entreprise">Entreprise</label>
                      <div className="autocomplete">
                        <input
                          id="filter-entreprise"
                          placeholder="Nom de l'entreprise"
                          value={filters.entreprise}
                          onChange={handleFilterChange('entreprise')}
                          onFocus={() => {
                            setShowEntrepriseSuggestions(true)
                            setShowStatusOptions(false)
                          }}
                          onBlur={() => setShowEntrepriseSuggestions(false)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              setShowEntrepriseSuggestions(false)
                            }
                          }}
                          aria-autocomplete="list"
                          aria-expanded={showEntrepriseSuggestions}
                        />
                        {showEntrepriseSuggestions && (
                          <div className="autocomplete-list" role="listbox">
                            {entrepriseSuggestions.length > 0 ? (
                              entrepriseSuggestions.map((entreprise) => (
                                <button
                                  key={entreprise}
                                  type="button"
                                  className="autocomplete-item"
                                  role="option"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    handleEntrepriseSelect(entreprise)
                                  }}
                                >
                                  {entreprise}
                                </button>
                              ))
                            ) : (
                              <div className="autocomplete-empty">Aucun résultat</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="filter-field filter-field--date">
                      <label>Dates</label>
                      <div className="filter-range">
                        <div className="control-shell control-shell--date">
                          <DatePickerInput
                            value={filters.dateFrom}
                            onChange={(date) => setFilters((prev) => ({ ...prev, dateFrom: date }))}
                            placeholder="jj/mm/aaaa"
                          />
                        </div>
                        <span className="range-separator">—</span>
                        <div className="control-shell control-shell--date">
                          <DatePickerInput
                            value={filters.dateTo}
                            onChange={(date) => setFilters((prev) => ({ ...prev, dateTo: date }))}
                            placeholder="jj/mm/aaaa"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="filter-field filter-field--surface">
                      <label>Surface (m²)</label>
                      <div className="filter-range">
                        <input
                          type="number"
                          min="0"
                          placeholder="Min"
                          value={filters.surfaceMin}
                          onChange={handleFilterChange('surfaceMin')}
                        />
                        <span className="range-separator">—</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Max"
                          value={filters.surfaceMax}
                          onChange={handleFilterChange('surfaceMax')}
                        />
                      </div>
                    </div>

                    <div className="filter-field filter-field--budget">
                      <label>Budget (Ar)</label>
                      <div className="filter-range">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Min"
                          value={filters.budgetMin}
                          onChange={handleFilterChange('budgetMin')}
                        />
                        <span className="range-separator">—</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Max"
                          value={filters.budgetMax}
                          onChange={handleFilterChange('budgetMax')}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="filters-actions">
                    <button
                      type="button"
                      className="filters-reset"
                      onClick={resetFilters}
                      disabled={!hasActiveFilters}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          <div className={`view-wrapper ${activeView === 'map' ? 'is-map' : ''}`}>
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default MapPage
