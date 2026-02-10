import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
const DEFAULT_FORM = { price: '' }

export default function M2ForfaitFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')
  const token = localStorage.getItem('token')

  const editingId = params.id ? Number(params.id) : null
  const isEditing = Boolean(editingId)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      if (!isEditing) return

      try {
        setLoading(true)
        setError('')
        const response = await fetch(`/api/m2-forfaits/${editingId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du chargement du forfait')
        }

        setForm({ price: data.price != null ? String(data.price) : '' })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [editingId, isEditing, token])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const validate = () => {
    setError('')
    const price = Number(form.price)
    if (!Number.isFinite(price) || price <= 0) {
      setError('Veuillez saisir un tarif au m² valide.')
      return null
    }
    return { price }
  }

  const handleSubmit = async () => {
    const validated = validate()
    if (!validated) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch(isEditing ? `/api/m2-forfaits/${editingId}` : '/api/m2-forfaits', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          price: validated.price,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement')
      }

      navigate('/m2-forfait')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
          <button className="nav-button" onClick={() => navigate('/m2-forfait')}>⬅️ Liste</button>
          <button className="logout-button" onClick={handleLogout}>🚪 Déconnexion</button>
        </div>
      </header>

      <div className="forfaits-content">
        <section className="forfaits-card">
          <h2>{isEditing ? 'Modifier un forfait' : 'Ajouter un forfait'}</h2>
          <div className="forfaits-form">
            <div className="forfaits-field">
              <label htmlFor="prixM2">Tarif (Ar/m²)</label>
              <input
                id="prixM2"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={handleChange('price')}
                placeholder="Ex: 15000"
                disabled={loading}
              />
            </div>

            <div className="forfaits-actions">
              <button className="action-button" type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? '⏳ Enregistrement...' : isEditing ? '💾 Enregistrer' : '➕ Ajouter'}
              </button>
              <button className="nav-button" type="button" onClick={() => navigate('/m2-forfait')} disabled={loading}>
                Annuler
              </button>
            </div>
          </div>

          {error && <div className="error" style={{ marginTop: '10px' }}>Erreur: {error}</div>}
        </section>
      </div>
    </div>
  )
}
