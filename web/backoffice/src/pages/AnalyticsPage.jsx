import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import BackofficeSidebar from '../components/BackofficeSidebar'

const normalizeStatus = (status) => {
  const s = (status || '').toString().toLowerCase()
  if (['nouveau', 'new'].includes(s)) return 'new'
  if (['en_cours', 'en cours', 'in_progress', 'in progress'].includes(s)) return 'in_progress'
  if (['terminÃ©', 'termine', 'completed', 'done', 'complete'].includes(s)) return 'completed'
  return 'new'
}

const DEFAULT_WEIGHTS = {
  new: 0,
  in_progress: 50,
  completed: 100,
}

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'object') {
    if (value.toDate) return value.toDate()
    if (value.seconds) return new Date(value.seconds * 1000)
  }
  return null
}

const dateRangeCollector = () => ({
  count: 0,
  min: null,
  max: null,
})

const addDateToRange = (range, date) => {
  if (!date) return
  range.count += 1
  if (!range.min || date < range.min) range.min = date
  if (!range.max || date > range.max) range.max = date
}

const daysBetween = (end, start) => {
  if (!end || !start) return null
  const ms = end.getTime() - start.getTime()
  return ms < 0 ? null : ms / (1000 * 60 * 60 * 24)
}

const formatSimpleDate = (value) => {
  if (!value) return 'â€”'
  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  if (isNaN(new Date(d).getTime())) return 'â€”'
  return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')
  const token = localStorage.getItem('token')

  const [events, setEvents] = useState([])
  const [unsyncedEvents, setUnsyncedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [types, setTypes] = useState([])
  const [selectedType, setSelectedType] = useState('')
  const [workStats, setWorkStats] = useState(null)
  const [workTimelines, setWorkTimelines] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchSignalements = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/signalements', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Erreur lors du chargement des signalements')

      const data = await response.json()
      const transformed = data.map(signalement => ({
        id: signalement.id,
        status: signalement.detail?.etat || 'nouveau',
        date: signalement.detail?.dateProblem || signalement.createdAt,
        work: signalement.detail?.work,
        typeProblem: signalement.typeProblem,
      }))

      setEvents(transformed)
    } catch (err) {
      setError(err.message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchUnsynced = useCallback(async () => {
    if (role !== 'manager' || !token) return
    try {
      const response = await fetch('/api/signalements/firebase/unsynced', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) return

      const data = await response.json()
      const transformed = data.map(signalement => ({
        id: `firebase_${signalement.firebaseId}`,
        status: signalement.reportStatus || 'new',
        date: signalement.createdAt,
        work: signalement.work,
        typeProblem: signalement.typeProblem,
      }))

      setUnsyncedEvents(transformed)
    } catch (err) {
      console.warn('Erreur unsynced:', err)
      setUnsyncedEvents([])
    }
  }, [role, token])

  useEffect(() => {
    fetchSignalements()
    fetchUnsynced()
    fetchWeights()
    fetchCompanies()
    fetchWorkStats()
    fetchWorkTimelines()
  }, [fetchSignalements, fetchUnsynced, startDate, endDate, selectedType])

  useEffect(() => {
    buildTypes()
  }, [events])

  const buildTypes = () => {
    const values = Array.from(new Set(events.map(e => (e.typeProblem || e.type || '').toLowerCase()).filter(Boolean)))
      .sort()
    setTypes(values)
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Impossible de charger les entreprises')
      const data = await response.json()
      setCompanies(data)
    } catch (err) {
      console.warn('Companies not loaded:', err.message)
      setCompanies([])
    }
  }

  const fetchWorkStats = async (companyId) => {
    try {
      const params = new URLSearchParams()
      if (companyId) params.append('companyId', companyId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedType) params.append('typeProblem', selectedType)
      const url = `/api/analytics/work-stats${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Impossible de charger les statistiques de travaux')
      const data = await response.json()
      setWorkStats(data)
    } catch (err) {
      console.warn('Work stats not loaded:', err.message)
      setWorkStats(null)
    }
  }

  const fetchWorkTimelines = async (companyId) => {
    try {
      const params = new URLSearchParams()
      if (companyId) params.append('companyId', companyId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedType) params.append('typeProblem', selectedType)
      const url = `/api/analytics/work-timelines${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) throw new Error('Impossible de charger les timelines')
      const data = await response.json()
      setWorkTimelines(data)
    } catch (err) {
      console.warn('Timelines not loaded:', err.message)
      setWorkTimelines([])
    }
  }

  const fetchWeights = async () => {
    try {
      const response = await fetch('/api/advancement-rates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Impossible de charger les pourcentages')
      const data = await response.json()
      const mapped = { ...DEFAULT_WEIGHTS }
      data.forEach((item) => {
        const key = normalizeStatus(item.statusKey)
        mapped[key] = item.percentage
      })
      setWeights(mapped)
    } catch (err) {
      console.warn('Weights fallback to default:', err.message)
      setWeights(DEFAULT_WEIGHTS)
    }
  }

  const analytics = useMemo(() => {
    const merged = [...events].filter((evt) => {
      const created = toDate(evt.date) || toDate(evt.createdAt)
      const typeOk = !selectedType || (evt.typeProblem || evt.type || '').toLowerCase() === selectedType.toLowerCase()
      if (!typeOk) return false
      if (!created) return true
      if (startDate && created < new Date(startDate)) return false
      if (endDate && created > new Date(endDate + 'T23:59:59')) return false
      return true
    })
    if (!merged.length) {
      return {
        progressPercent: 0,
        counts: { new: 0, in_progress: 0, completed: 0 },
        stageRanges: {
          new: dateRangeCollector(),
          in_progress: dateRangeCollector(),
          completed: dateRangeCollector(),
        },
        averages: { lead: null, inProgress: null, total: null },
      }
    }

    const ranges = {
      new: dateRangeCollector(),
      in_progress: dateRangeCollector(),
      completed: dateRangeCollector(),
    }

    const counts = { new: 0, in_progress: 0, completed: 0 }
    let totalWeight = 0
    const leadTimes = []
    const inProgressTimes = []
    const totalTimes = []

    merged.forEach((evt) => {
      const status = normalizeStatus(evt.status)
      counts[status] = (counts[status] || 0) + 1
      totalWeight += weights[status] ?? DEFAULT_WEIGHTS[status] ?? 0

      const createdAt = toDate(evt.date) || toDate(evt.createdAt)
      const startDate = toDate(evt.work?.startDate)
      const completedDate = toDate(evt.work?.realEndDate || evt.work?.endDate || evt.updatedAt)

      addDateToRange(ranges.new, createdAt)
      addDateToRange(ranges.in_progress, startDate)
      if (status === 'completed') addDateToRange(ranges.completed, completedDate)

      const lead = daysBetween(startDate, createdAt)
      if (lead != null) leadTimes.push(lead)

      const inProg = daysBetween(completedDate, startDate)
      if (inProg != null) inProgressTimes.push(inProg)

      const total = daysBetween(completedDate, createdAt)
      if (total != null) totalTimes.push(total)
    })

    const average = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null)

    return {
      progressPercent: Math.round(totalWeight / merged.length),
      counts,
      stageRanges: ranges,
      averages: {
        lead: average(leadTimes),
        inProgress: average(inProgressTimes),
        total: average(totalTimes),
      },
    }
  }, [events, selectedType, startDate, endDate, weights])

  const cycleAvgDays = useMemo(() => {
    const durations = workTimelines
      .filter(row => row.startDate && row.endDate)
      .map(row => {
        const start = new Date(row.startDate)
        const end = new Date(row.endDate)
        const diffMs = end.getTime() - start.getTime()
        return diffMs >= 0 ? diffMs / (1000 * 60 * 60 * 24) : null
      })
      .filter(v => v != null)
    if (!durations.length) return null
    return durations.reduce((a, b) => a + b, 0) / durations.length
  }, [workTimelines])

  const formatRange = (range) => {
    if (!range.count || !range.min) return 'Aucune date'
    const formatter = new Intl.DateTimeFormat('fr-FR')
    if (!range.max || range.min.getTime() === range.max.getTime()) {
      return formatter.format(range.min)
    }
    return `${formatter.format(range.min)} â†’ ${formatter.format(range.max)}`
  }

  const formatDays = (value) => (value == null ? 'â€”' : `${value.toFixed(1)} j`)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const handleSyncFirebase = async () => {
    try {
      setSyncing(true)
      setSyncMessage('')
      const response = await fetch('/api/signalements/sync/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la synchronisation')
      }

      const data = await response.json()
      setSyncMessage(`âœ“ ${data.imported} signalements importÃ©s depuis Firebase`)
      await fetchSignalements()
      await fetchUnsynced()
    } catch (err) {
      setSyncMessage(`âœ— Erreur: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const primaryMenu = [
    { label: 'Tableau de bord', icon: 'Map', onClick: () => navigate('/dashboard'), path: '/dashboard' },
    { label: 'Analyses', icon: 'Stats', onClick: () => navigate('/analytics'), path: '/analytics' },
    { label: 'Utilisateurs', icon: 'Users', onClick: () => navigate('/users'), path: '/users', requiresManager: true },
  ]

  const secondaryMenu = [
    {
      label: syncing ? 'Synchronisation...' : 'Sync Firebase',
      icon: 'Sync',
      onClick: handleSyncFirebase,
      disabled: syncing,
      requiresManager: true,
    },
  ]

  return (
    <div className="dashboard-container analytics-page">
      <div className="dashboard-layout">
        <BackofficeSidebar
          title="Menu principal"
          subtitle="Analyse"
          username={username}
          role={role}
          primaryItems={primaryMenu}
          secondaryItems={secondaryMenu}
          onLogout={handleLogout}
        />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="header-left">
              <div>
                <h1>Analyse des travaux</h1>
                <p className="user-info">Connecte en tant que: <strong>{username}</strong> ({role})</p>
              </div>
            </div>
          </header>

          <div className="analytics-content">
        <div className="analytics-filters">
          <div className="filter-row filter-row--wrap">
            <label className="filter-field filter-field--date">
              <span className="filter-label">Date debut</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="filter-field filter-field--date">
              <span className="filter-label">Date fin</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>

            <label className="filter-field">
              <span className="filter-label">Entreprise</span>
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedCompanyId(val)
                  fetchWorkStats(val || null)
                  fetchWorkTimelines(val || null)
                }}
              >
                <option value="">Toutes</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span className="filter-label">Type</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Tous</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <button className="analytics-reset" onClick={() => { setStartDate(''); setEndDate(''); setSelectedCompanyId(''); setSelectedType(''); fetchWorkStats(); fetchWorkTimelines(); }}>
              Reinitialiser
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className={syncMessage.startsWith('âœ“') ? 'success' : 'error'} style={{ marginBottom: '8px' }}>
            {syncMessage}
          </div>
        )}
        {error && <div className="error">Erreur: {error}</div>}
        {loading && <div className="loading">Chargement des donnÃ©es...</div>}

        {!loading && (
          <>
          
            <div className="analytics-grid">
              <div className="analytic-card primary">
                <div className="analytic-label">Avancement moyen</div>
                <div className="analytic-value">{analytics.progressPercent}%</div>
                <div className="analytic-bar">
                  <div
                    className="analytic-bar-fill"
                    style={{ width: `${analytics.progressPercent}%` }}
                  />
                </div>
                <div className="analytic-sub">
                  Nouveau 0% · En cours 50% · Termine 100%
                </div>
              </div>

              

              <div className="analytic-card">
                <div className="analytic-label">Repartition</div>
                <div className="badge-row">
                  <span className="pill pill-new">Nouveau {analytics.counts.new}</span>
                  <span className="pill pill-progress">En cours {analytics.counts.in_progress}</span>
                  <span className="pill pill-done">Termine {analytics.counts.completed}</span>
                </div>
                <div className="analytic-sub">Signalements synchronises</div>
              </div>

              <div className="analytic-card">
                <div className="analytic-label">Cycle complet (moyenne)</div>
                <div className="analytic-value">{formatDays(cycleAvgDays)}</div>
                <div className="analytic-sub">Debut vers fin</div>
              </div>

            </div>

            {workStats && (
              <>
                <div className="timeline-table">
                  <div className="section-header">
                    <h3>Chronologie des travaux</h3>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Entreprise</th>
                          <th>Type</th>
                          <th>DÃ©but</th>
                          <th>En cours</th>
                          <th>Fin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workTimelines.map((row) => {
                          const startCell = row.startDate ? formatSimpleDate(row.startDate) : 'â€”'
                          const endCell = row.endDate ? formatSimpleDate(row.endDate) : 'â€”'
                          const inProgressCell = row.endDate
                            ? 'â€”'
                            : (row.inProgressDate ? formatSimpleDate(row.inProgressDate) : 'â€”')
                          return (
                            <tr key={row.id}>
                              <td>{row.companyName || 'â€”'}</td>
                              <td>{row.typeProblem || 'â€”'}</td>
                              <td>{startCell}</td>
                              <td>{inProgressCell}</td>
                              <td>{endCell}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            
          </>
        )}
          </div>
        </main>
      </div>
    </div>
  )
}

