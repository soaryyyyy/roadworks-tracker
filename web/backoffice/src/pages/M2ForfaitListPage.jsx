import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteM2Forfait, loadM2Forfaits } from './m2ForfaitStore'

export default function M2ForfaitListPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(loadM2Forfaits())
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const handleDelete = (id) => {
    setItems(deleteM2Forfait(id))
  }

  if (role !== 'manager') {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Forfait m²</h1>
            <p className="user-info">Connecté en tant que: <strong>{username}</strong> ({role})</p>
          </div>
          <div className="header-actions">
            <button className="nav-button" onClick={() => navigate('/dashboard')}>⬅️ Dashboard</button>
            <button className="logout-button" onClick={handleLogout}>🚪 Déconnexion</button>
          </div>
        </header>

        <div className="forfaits-content">
          <div className="error">Accès réservé au manager.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Forfait m²</h1>
          <p className="user-info">Connecté en tant que: <strong>{username}</strong> ({role})</p>
        </div>
        <div className="header-actions">
          <button className="nav-button" onClick={() => navigate('/dashboard')}>⬅️ Dashboard</button>
          <button className="nav-button" onClick={() => navigate('/analytics')}>📊 Analytics</button>
          <button className="logout-button" onClick={handleLogout}>🚪 Déconnexion</button>
        </div>
      </header>

      <div className="forfaits-content">
        <section className="forfaits-card">
          <div className="forfaits-card-header">
            <h2>Liste des forfaits</h2>
            <button className="action-button" type="button" onClick={() => navigate('/m2-forfait/new')}>
              ➕ Ajouter
            </button>
          </div>

          {items.length === 0 ? (
            <p className="forfaits-empty">Aucun forfait défini pour le moment.</p>
          ) : (
            <div className="forfaits-table-wrap">
              <table className="forfaits-table">
                <thead>
                  <tr>
                    <th>Niveau</th>
                    <th>Tarif (Ar/m²)</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.niveau}</td>
                      <td>{Number(item.prixM2).toLocaleString('fr-FR')}</td>
                      <td>
                        <div className="forfaits-row-actions">
                          <button className="nav-button" type="button" onClick={() => navigate(`/m2-forfait/${item.id}/edit`)}>
                            ✏️ Modifier
                          </button>
                          <button className="logout-button" type="button" onClick={() => handleDelete(item.id)}>
                            🗑️ Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

