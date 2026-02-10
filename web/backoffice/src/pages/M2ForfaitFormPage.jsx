import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadM2Forfaits, upsertM2Forfait } from './m2ForfaitStore'

const DEFAULT_FORM = { niveau: '', prixM2: '' }

export default function M2ForfaitFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')

  const levels = useMemo(() => Array.from({ length: 10 }, (_, index) => index + 1), [])

  const editingId = params.id ? Number(params.id) : null
  const existing = useMemo(() => {
    if (!editingId) return null
    return loadM2Forfaits().find((item) => item.id === editingId) ?? null
  }, [editingId])

  const [form, setForm] = useState(() => {
    if (!existing) return DEFAULT_FORM
    return { niveau: String(existing.niveau), prixM2: String(existing.prixM2) }
  })
  const [error, setError] = useState('')

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
    const niveau = Number(form.niveau)
    const prixM2 = Number(form.prixM2)

    if (!Number.isFinite(niveau) || niveau < 1 || niveau > 10) {
      setError('Veuillez sélectionner un niveau (1 à 10).')
      return null
    }
    if (!Number.isFinite(prixM2) || prixM2 <= 0) {
      setError('Veuillez saisir un tarif au m² valide.')
      return null
    }

    const items = loadM2Forfaits()
    const isDuplicate = items.some((item) => item.niveau === niveau && item.id !== editingId)
    if (isDuplicate) {
      setError('Ce niveau existe déjà.')
      return null
    }

    return { niveau, prixM2 }
  }

  const handleSubmit = () => {
    const validated = validate()
    if (!validated) return

    upsertM2Forfait({ id: editingId, ...validated })
    navigate('/m2-forfait')
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
          <h2>{editingId ? 'Modifier un forfait' : 'Ajouter un forfait'}</h2>
          <div className="forfaits-form">
            <div className="forfaits-field">
              <label htmlFor="niveau">Niveau</label>
              <select id="niveau" value={form.niveau} onChange={handleChange('niveau')}>
                <option value="">--</option>
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="forfaits-field">
              <label htmlFor="prixM2">Tarif (Ar/m²)</label>
              <input
                id="prixM2"
                type="number"
                min="0"
                step="1"
                value={form.prixM2}
                onChange={handleChange('prixM2')}
                placeholder="Ex: 15000"
              />
            </div>

            <div className="forfaits-actions">
              <button className="action-button" type="button" onClick={handleSubmit}>
                {editingId ? '💾 Enregistrer' : '➕ Ajouter'}
              </button>
              <button className="nav-button" type="button" onClick={() => navigate('/m2-forfait')}>
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

