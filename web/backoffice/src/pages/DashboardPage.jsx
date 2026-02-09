import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { iconByType } from '../mapIcons'
import SignalementDetailModal from '../components/SignalementDetailModal'
import NotificationToast from '../components/NotificationToast'
import BackofficeSidebar from '../components/BackofficeSidebar'
import { useNotifications } from '../hooks/useNotifications'

// Mapping des types de problÃ¨mes vers les types d'icÃ´nes
const mapProblemTypeToIcon = (typeName) => {
  if (!typeName) return 'other'

  const lower = typeName.toLowerCase()

  // Types directs depuis Firebase/mobile
  const directTypes = ['pothole', 'blocked_road', 'accident', 'construction', 'flooding', 'debris', 'poor_surface', 'other']
  if (directTypes.includes(lower)) return lower

  // Fallback pour anciens types franÃ§ais
  if (lower.includes('danger')) return 'danger'
  if (lower.includes('travaux') || lower.includes('work')) return 'construction'
  if (lower.includes('inondation') || lower.includes('eau') || lower.includes('water')) return 'flooding'
  if (lower.includes('fermÃ©e') || lower.includes('closed') || lower.includes('barr')) return 'blocked_road'
  if (lower.includes('risque') || lower.includes('warning')) return 'poor_surface'
  if (lower.includes('rÃ©solu')) return 'ok'

  return 'other'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')
  const token = localStorage.getItem('token')
  const [events, setEvents] = useState([])
  const [unsyncedEvents, setUnsyncedEvents] = useState([]) // Signalements Firebase non synchronisÃ©s
  const [totalUnsyncedCount, setTotalUnsyncedCount] = useState(0) // Total incluant ceux sans coordonnÃ©es
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [syncingStatus, setSyncingStatus] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showUnsyncedLegend, setShowUnsyncedLegend] = useState(true) // Pour afficher/masquer la lÃ©gende

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

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des signalements')
      }

      const data = await response.json()

      // Transformer les donnÃ©es pour correspondre au format attendu
      const transformedEvents = data.map(signalement => {
        const [lat, lon] = signalement.location.split(',').map(parseFloat)
        return {
          id: signalement.id,
          type: mapProblemTypeToIcon(signalement.typeProblem),
          title: signalement.typeProblem || 'Signalement',
          lat: lat || 0,
          lon: lon || 0,
          description: signalement.detail?.description || 'Aucune description',
          status: signalement.detail?.etat || 'nouveau',
          date: signalement.detail?.dateProblem,
          work: signalement.detail?.work,
          isSynced: true, // Les signalements de la BDD sont synchronisÃ©s
        }
      })

      setEvents(transformedEvents)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [token])

  // Fonction pour rÃ©cupÃ©rer les signalements Firebase non synchronisÃ©s (seulement pour les managers)
  const fetchUnsyncedFirebaseSignalements = useCallback(async () => {
    console.log('fetchUnsyncedFirebaseSignalements called, role:', role, 'token:', token ? 'present' : 'absent')
    
    // Seul le manager peut voir les signalements non synchronisÃ©s
    if (role !== 'manager') {
      console.log('Non manager (role=' + role + '), skip fetch unsynced')
      return
    }
    if (!token) {
      console.log('No token, skip fetch unsynced')
      return
    }

    try {
      console.log('Fetching unsynced Firebase signalements...')
      const response = await fetch('/api/signalements/firebase/unsynced', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.warn('Impossible de rÃ©cupÃ©rer les signalements Firebase non synchronisÃ©s')
        return
      }

      const data = await response.json()

      // Transformer les donnÃ©es Firebase - filtrer ceux avec coordonnÃ©es valides
      const transformedUnsyncedEvents = data
        .filter(signalement => signalement.lat !== undefined && signalement.lng !== undefined)
        .map(signalement => ({
          id: `firebase_${signalement.firebaseId}`,
          firebaseId: signalement.firebaseId,
          type: mapProblemTypeToIcon(signalement.typeProblem),
          title: signalement.typeProblem || 'Signalement',
          lat: parseFloat(signalement.lat),
          lon: parseFloat(signalement.lng),
          description: signalement.description || 'Aucune description',
          status: signalement.reportStatus || 'new',
          isSynced: false,
        }))

      setTotalUnsyncedCount(data.length)
      setUnsyncedEvents(transformedUnsyncedEvents)
    } catch (err) {
      console.warn('Erreur lors du chargement des signalements Firebase non synchronisÃ©s:', err)
      setUnsyncedEvents([])
      setTotalUnsyncedCount(0)
    }
  }, [token, role])

  // Hook pour les notifications WebSocket
  const { connected, notifications, clearNotification, clearAll } = useNotifications()

  useEffect(() => {
    fetchSignalements()
    // Ne plus charger automatiquement les signalements Firebase
    // Ils seront chargÃ©s uniquement lors de la synchronisation
  }, [fetchSignalements])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const handleMarkerClick = (event) => {
    setSelectedEvent(event)
  }

  const handleStatusChange = (newStatus) => {
    setEvents(events.map(evt =>
      evt.id === selectedEvent.id
        ? { ...evt, status: newStatus }
        : evt
    ))
    setSelectedEvent(prev => ({
      ...prev,
      status: newStatus,
    }))
  }

  const handleSyncFirebase = async () => {
    try {
      setSyncing(true)
      setSyncMessage('')

      // D'abord, rÃ©cupÃ©rer les signalements Firebase non synchronisÃ©s pour affichage
      await fetchUnsyncedFirebaseSignalements()

      // Ensuite, faire la synchronisation
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

      // RafraÃ®chir la liste des signalements locaux
      await fetchSignalements()
      
      // Vider les signalements non synchronisÃ©s aprÃ¨s la sync
      setUnsyncedEvents([])
      setTotalUnsyncedCount(0)
    } catch (err) {
      console.error('Erreur:', err)
      setSyncMessage(`âœ— Erreur: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  // Envoyer les signalements locaux vers Firebase (mobile)
  const handleExportToMobile = async () => {
    try {
      setExporting(true)
      setSyncMessage('')

      const response = await fetch('/api/signalements/sync/to-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi vers mobile')
      }

      const data = await response.json()
      setSyncMessage(`âœ“ ${data.exported} signalements envoyÃ©s vers l'application mobile`)

      // RafraÃ®chir la liste
      await fetchSignalements()
    } catch (err) {
      console.error('Erreur:', err)
      setSyncMessage(`âœ— Erreur: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  // Synchroniser tous les statuts modifiÃ©s vers Firebase (mobile)
  const handleSyncStatusToMobile = async () => {
    try {
      setSyncingStatus(true)
      setSyncMessage('')

      const response = await fetch('/api/signalements/sync/status-to-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la synchronisation des statuts')
      }

      const data = await response.json()
      setSyncMessage(`âœ“ ${data.synced} statuts synchronisÃ©s vers l'application mobile`)
    } catch (err) {
      console.error('Erreur:', err)
      setSyncMessage(`âœ— Erreur: ${err.message}`)
    } finally {
      setSyncingStatus(false)
    }
  }

  const primaryMenu = [
    { label: 'Tableau de bord', icon: 'Map', onClick: () => navigate('/dashboard'), path: '/dashboard' },
    { label: 'Analyses', icon: 'Stats', onClick: () => navigate('/analytics'), path: '/analytics' },
    { label: 'Utilisateurs', icon: 'Users', onClick: () => navigate('/users'), path: '/users', requiresManager: true },
  ]

  const secondaryMenu = [
    {
      label: 'Importer de Mobile',
      icon: 'Import',
      onClick: handleSyncFirebase,
      disabled: syncing || exporting || syncingStatus,
      requiresManager: true,
    },
    {
      label: 'Envoyer vers mobile',
      icon: 'Export',
      onClick: handleExportToMobile,
      disabled: syncing || exporting || syncingStatus,
      requiresManager: true,
    },
    {
      label: 'Sync statuts',
      icon: 'Sync',
      onClick: handleSyncStatusToMobile,
      disabled: syncing || exporting || syncingStatus,
      requiresManager: true,
    },
  ]

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <BackofficeSidebar
          title="Menu principal"
          subtitle="Operations"
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
                <h1>Dashboard - Suivi des travaux routiers</h1>
                <p className="user-info">
                  Connecte en tant que: <strong>{username}</strong> ({role})
                </p>
              </div>
            </div>
            <div className="header-actions">
          {/* IcÃ´ne de notification */}
          <div className="notification-bell-container">
            <button
              className="notification-bell"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              title="Notifications"
            >
              ðŸ””
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={() => { clearAll(); setShowNotifDropdown(false); }}>
                      Tout effacer
                    </button>
                  )}
                </div>
                <div className="notification-dropdown-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">Aucune notification</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="notification-item"
                        onClick={() => {
                          fetchSignalements();
                          setShowNotifDropdown(false);
                        }}
                      >
                        <div className="notification-item-icon">
                          {notif.type === 'NEW_SIGNALEMENT' ? 'ðŸ†•' :
                           notif.type === 'STATUS_UPDATED' ? 'ðŸ”„' :
                           notif.type === 'WORK_ADDED' ? 'ðŸ”§' : 'ðŸ“¢'}
                        </div>
                        <div className="notification-item-content">
                          <div className="notification-item-message">{notif.message}</div>
                          <div className="notification-item-time">
                            {new Date(notif.timestamp).toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
</div>
          </header>
          
          <div className="map-container">
        {loading && <div className="loading">Chargement des signalements...</div>}
        {error && <div className="error">Erreur: {error}</div>}
        {syncMessage && <div className={syncMessage.includes('âœ“') ? 'success' : 'error'}>{syncMessage}</div>}
        
        {!loading && (
          <>
            <div className="info-bar">
              ðŸ“ {events.length} signalement{events.length > 1 ? 's' : ''} local{events.length > 1 ? 'aux' : ''}
              {role === 'manager' && (
                <span className="sync-hint">
                  {' '}| ðŸ“¥ Importer = rÃ©cupÃ©rer de l app mobile | ðŸ“¤ Envoyer = exporter vers l app mobile
                </span>
              )}
              {role === 'manager' && totalUnsyncedCount > 0 && (
                <span className="unsynced-count">
                  {' '}| ðŸ”¶ {totalUnsyncedCount} en attente de synchronisation
                  {unsyncedEvents.length < totalUnsyncedCount && (
                    <span className="coords-warning"> ({totalUnsyncedCount - unsyncedEvents.length} sans coordonnÃ©es)</span>
                  )}
                </span>
              )}
            </div>
            
            {/* LÃ©gende pour les managers */}
            {role === 'manager' && totalUnsyncedCount > 0 && showUnsyncedLegend && (
              <div className="map-legend">
                <div className="legend-header">
                  <span>ðŸ“‹ LÃ©gende</span>
                  <button onClick={() => setShowUnsyncedLegend(false)} className="legend-close">Ã—</button>
                </div>
                <div className="legend-item">
                  <span className="legend-icon synced">â—</span>
                  <span>Signalements synchronisÃ©s</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon unsynced">â—</span>
                  <span>Firebase non synchronisÃ©s (cliquez pour synchroniser)</span>
                </div>
              </div>
            )}
            
            <div className="map-root">
              <MapContainer center={[-18.95, 47.52]} zoom={10} className="map-inner" scrollWheelZoom>
                <TileLayer url="http://localhost:8089/styles/basic-preview/512/{z}/{x}/{y}.png" attribution="Â© OpenStreetMap contributors" />

                {/* Signalements synchronisÃ©s */}
                {events.map((event) => (
                  <Marker
                    key={event.id}
                    position={[event.lat, event.lon]}
                    icon={iconByType[event.type]}
                    eventHandlers={{ click: () => handleMarkerClick(event) }}
                  >
                    <Popup>
                      <div style={{ cursor: 'pointer' }}>
                        <strong>{event.title}</strong>
                        <p>{event.description}</p>
                        <small>ID: {event.id}</small>
                        <br />
                        <button
                          onClick={() => handleMarkerClick(event)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '8px',
                          }}
                        >
                          Voir dÃ©tails
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Signalements Firebase non synchronisÃ©s (visibles pour tous) */}
                {unsyncedEvents.map((event) => (
                  <Marker
                    key={event.id}
                    position={[event.lat, event.lon]}
                    icon={iconByType[event.type] || iconByType.other}
                  >
                    <Popup>
                      <div style={{ cursor: 'pointer' }}>
                        <div style={{ 
                          backgroundColor: '#17a2b8', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          marginBottom: '8px',
                          fontSize: '12px'
                        }}>
                          ðŸ”¶ Non synchronisÃ©
                        </div>
                        <strong>{event.title}</strong>
                        <p>{event.description}</p>
                        <small>Firebase ID: {event.firebaseId}</small>
                        <br />
                        <button
                          onClick={handleSyncFirebase}
                          disabled={syncing}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: syncing ? 'not-allowed' : 'pointer',
                            marginTop: '8px',
                            opacity: syncing ? 0.7 : 1,
                          }}
                        >
                          {syncing ? 'â³ Synchronisation...' : 'ðŸ”„ Synchroniser maintenant'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </>
        )}
          </div>
        </main>
      </div>

      {selectedEvent && (
        <SignalementDetailModal
          signalement={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusChange={handleStatusChange}
          isManager={role === 'manager'}
          token={token}
        />
      )}

      {/* Notifications en temps rÃ©el */}
      <NotificationToast
        notifications={notifications}
        onDismiss={clearNotification}
        onRefresh={fetchSignalements}
      />

      {/* Indicateur de connexion WebSocket */}
      <div className="ws-status">
        <div className={`ws-status-dot ${connected ? 'connected' : 'disconnected'}`}></div>
        <span>{connected ? 'Temps rÃ©el' : 'DÃ©connectÃ©'}</span>
      </div>
    </div>
  )
}






