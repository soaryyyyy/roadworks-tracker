import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { iconByType } from '../mapIcons'
import SignalementDetailModal from '../components/SignalementDetailModal'
import NotificationToast from '../components/NotificationToast'
import { useNotifications } from '../hooks/useNotifications'
import './DashboardPage.css'

// Mapping des types de problèmes vers les types d'icônes
const mapProblemTypeToIcon = (typeName) => {
  if (!typeName) return 'other'

  const lower = typeName.toLowerCase()

  // Types directs depuis Firebase/mobile
  const directTypes = ['pothole', 'blocked_road', 'accident', 'construction', 'flooding', 'debris', 'poor_surface', 'other']
  if (directTypes.includes(lower)) return lower

  // Fallback pour anciens types français
  if (lower.includes('danger')) return 'danger'
  if (lower.includes('travaux') || lower.includes('work')) return 'construction'
  if (lower.includes('inondation') || lower.includes('eau') || lower.includes('water')) return 'flooding'
  if (lower.includes('fermée') || lower.includes('closed') || lower.includes('barr')) return 'blocked_road'
  if (lower.includes('risque') || lower.includes('warning')) return 'poor_surface'
  if (lower.includes('résolu')) return 'ok'

  return 'other'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')
  const token = localStorage.getItem('token')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

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

      // Transformer les données pour correspondre au format attendu
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

  // Hook pour les notifications WebSocket
  const { connected, notifications, clearNotification, clearAll } = useNotifications()

  useEffect(() => {
    fetchSignalements()
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
      setSyncMessage(`✓ ${data.imported} signalements importés depuis Firebase`)

      // Rafraîchir la liste des signalements
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      console.error('Erreur:', err)
      setSyncMessage(`✗ Erreur: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard - Suivi des travaux routiers</h1>
          <p className="user-info">Connecté en tant que: <strong>{username}</strong> ({role})</p>
        </div>
        <div className="header-actions">
          {role === 'manager' && (
            <>
              <button
                onClick={handleSyncFirebase}
                disabled={syncing}
                className="action-button"
                title="Synchroniser les données depuis Firebase"
              >
                {syncing ? '⏳ Synchronisation...' : '🔄 Synchroniser Firebase'}
              </button>
              <button onClick={() => navigate('/users')} className="action-button">
                👥 Gestion Utilisateurs
              </button>
            </>
          )}

          {/* Icône de notification */}
          <div className="notification-bell-container">
            <button
              className="notification-bell"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              title="Notifications"
            >
              🔔
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
                          {notif.type === 'NEW_SIGNALEMENT' ? '🆕' :
                           notif.type === 'STATUS_UPDATED' ? '🔄' :
                           notif.type === 'WORK_ADDED' ? '🔧' : '📢'}
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

          <button onClick={handleLogout} className="logout-button">
            🚪 Déconnexion
          </button>
        </div>
      </header>
      
      <div className="map-container">
        {loading && <div className="loading">Chargement des signalements...</div>}
        {error && <div className="error">Erreur: {error}</div>}
        {syncMessage && <div className={syncMessage.includes('✓') ? 'success' : 'error'}>{syncMessage}</div>}
        
        {!loading && (
          <>
            <div className="info-bar">
              📍 {events.length} signalement{events.length > 1 ? 's' : ''} affichés
            </div>
            <div className="map-root">
              <MapContainer center={[-18.91, 47.52]} zoom={13} className="map-inner" scrollWheelZoom>
                <TileLayer url="http://localhost:8081/styles/basic-preview/512/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />

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
                          Voir détails
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

      {selectedEvent && (
        <SignalementDetailModal
          signalement={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusChange={handleStatusChange}
          isManager={role === 'manager'}
          token={token}
        />
      )}

      {/* Notifications en temps réel */}
      <NotificationToast
        notifications={notifications}
        onDismiss={clearNotification}
        onRefresh={fetchSignalements}
      />

      {/* Indicateur de connexion WebSocket */}
      <div className="ws-status">
        <div className={`ws-status-dot ${connected ? 'connected' : 'disconnected'}`}></div>
        <span>{connected ? 'Temps réel' : 'Déconnecté'}</span>
      </div>
    </div>
  )
}
