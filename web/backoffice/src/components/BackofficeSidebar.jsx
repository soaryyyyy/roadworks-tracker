import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

const SIDEBAR_STORAGE_KEY = 'backoffice_sidebar_open'

export default function BackofficeSidebar({
  title = 'Backoffice',
  subtitle = 'Navigation',
  username = '',
  role = '',
  primaryItems = [],
  secondaryItems = [],
  onLogout,
}) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return saved == null ? true : saved === '1'
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? '1' : '0')
  }, [open])

  const visiblePrimaryItems = useMemo(
    () => primaryItems.filter((item) => !item.requiresManager || role === 'manager'),
    [primaryItems, role],
  )

  const visibleSecondaryItems = useMemo(
    () => secondaryItems.filter((item) => !item.requiresManager || role === 'manager'),
    [secondaryItems, role],
  )

  return (
    <>
      <button
        className={`sidebar-fab ${open ? 'hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <span aria-hidden>☰</span>
      </button>

      <aside className={`sidebar-shell ${open ? 'open' : 'collapsed'}`}>
        <div className="sidebar-top">
          <div>
            <p className="sidebar-brand">{title}</p>
            <p className="sidebar-subbrand">{subtitle}</p>
          </div>
          <button className="sidebar-toggle close" onClick={() => setOpen(false)} aria-label="Fermer le menu">
            ×
          </button>
        </div>

        <div className="sidebar-user">
          <span className="sidebar-user-label">Connecte</span>
          <strong>{username || 'Utilisateur'}</strong>
          <span className="sidebar-user-role">{role || 'role inconnu'}</span>
        </div>

        <nav className="sidebar-nav">
          {visiblePrimaryItems.map((item) => {
            const active = item.path ? location.pathname === item.path : false
            return (
              <button
                key={item.label}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={item.onClick}
                disabled={item.disabled}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {visibleSecondaryItems.length > 0 && (
          <div className="sidebar-section">
            <p className="sidebar-section-title">Actions</p>
            <div className="sidebar-nav">
              {visibleSecondaryItems.map((item) => (
                <button
                  key={item.label}
                  className="sidebar-nav-item subtle"
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            <span aria-hidden>🚪</span>
            <span>Deconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
