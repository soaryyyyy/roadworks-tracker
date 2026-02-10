import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function M2ForfaitListPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')
  const token = localStorage.getItem('token')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/m2-forfaits', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des forfaits')
        }

        const data = await response.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Supprimer ce forfait ?')
    if (!confirmed) return

    try {
      setError('')
      const response = await fetch(`/api/m2-forfaits/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
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

          {error && <div className="error" style={{ marginBottom: '10px' }}>Erreur: {error}</div>}

          {loading ? (
            <p className="forfaits-empty">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="forfaits-empty">Aucun forfait défini pour le moment.</p>
          ) : (
            <div className="forfaits-table-wrap">
              <table className="forfaits-table">
                <thead>
                  <tr>
                    <th>Tarif (Ar/m²)</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{Number(item.price).toLocaleString('fr-FR')}</td>
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
