import { useState, useEffect } from 'react'

export default function SignalementDetailModal({ signalement, onClose, onStatusChange, isManager, token }) {
  const [showStatusEdit, setShowStatusEdit] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(signalement.status)
  const [realEndDate, setRealEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWorkForm, setShowWorkForm] = useState(false)
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [reparationTypes, setReparationTypes] = useState([])
  const [loadingReparationTypes, setLoadingReparationTypes] = useState(false)
  const [defaultPrice, setDefaultPrice] = useState(null)
  const [loadingDefaultPrice, setLoadingDefaultPrice] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState('')
  
  // Form fields for work
  const [formData, setFormData] = useState({
    surface: '',
    companyId: '',
    reparationTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    price: '',
  })

  // Charger les companies au montage du composant
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true)
        const response = await fetch('/api/companies', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des entreprises')
        }

        const data = await response.json()
        setCompanies(data)
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoadingCompanies(false)
      }
    }

    const fetchReparationTypes = async () => {
      try {
        setLoadingReparationTypes(true)
        const response = await fetch('/api/reparation-types', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des niveaux de réparation')
        }

        const data = await response.json()
        setReparationTypes(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Erreur:', err)
        setReparationTypes([])
      } finally {
        setLoadingReparationTypes(false)
      }
    }

    const fetchDefaultPrice = async () => {
      try {
        setLoadingDefaultPrice(true)
        const response = await fetch('/api/m2-forfaits/current', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          setDefaultPrice(null)
          return
        }
        setDefaultPrice(data?.price ?? null)
      } catch (err) {
        console.error('Erreur:', err)
        setDefaultPrice(null)
      } finally {
        setLoadingDefaultPrice(false)
      }
    }

    if (showWorkForm) {
      fetchCompanies()
      fetchReparationTypes()
      fetchDefaultPrice()
    }
  }, [showWorkForm, token])

  const statusOptions = [
    { id: 1, label: 'Nouveau', value: 'nouveau' },
    { id: 2, label: 'En cours', value: 'en_cours' },
    { id: 3, label: 'Terminé', value: 'terminé' },
    { id: 4, label: 'Annulé', value: 'annulé' },
  ]

  const statusColors = {
    nouveau: '#fdcb6e',
    en_cours: '#e17055',
    terminé: '#27ae60',
    annulé: '#d63031',
  }

  const handleStatusUpdate = async () => {
    try {
      setLoading(true)
      setError('')

      // Si le statut est "terminé", vérifier qu'une date est fournie
      if (selectedStatus === 'terminé' && !realEndDate) {
        setError('La date de fin réelle est obligatoire pour terminer')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/signalements/${signalement.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: selectedStatus,
          realEndDate: selectedStatus === 'terminé' ? realEndDate : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut')
      }

      onStatusChange(selectedStatus)
      setShowStatusEdit(false)
      setRealEndDate('')
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitWork = async () => {
    try {
      setLoading(true)
      setError('')

      // Validation
      if (!formData.surface || !formData.companyId) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }
      if (!formData.price && !formData.reparationTypeId) {
        throw new Error('Le niveau de réparation est obligatoire si vous laissez le budget en automatique')
      }

      const response = await fetch(`/api/signalements/${signalement.id}/work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          surface: parseFloat(formData.surface),
          companyId: formData.companyId,
          reparationTypeId: formData.reparationTypeId ? Number(formData.reparationTypeId) : null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          price: formData.price ? parseFloat(formData.price) : null,
          status: 'en_cours', // Changer le statut à en_cours
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de la réparation')
      }

      // Mettre à jour le statut et fermer le formulaire
      onStatusChange('en_cours')
      setShowWorkForm(false)
      setShowStatusEdit(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const selectedReparationLevel = () => {
    const id = Number(formData.reparationTypeId)
    if (!Number.isFinite(id) || id <= 0) return null
    const match = reparationTypes.find((type) => Number(type.id) === id)
    const niveau = match?.niveau != null ? Number(match.niveau) : null
    return Number.isFinite(niveau) ? niveau : null
  }

  const estimateBudget = () => {
    const surface = Number(formData.surface)
    const priceM2 = Number(defaultPrice)
    const level = selectedReparationLevel()
    if (!Number.isFinite(surface) || surface <= 0) return null
    if (!Number.isFinite(priceM2) || priceM2 <= 0) return null
    if (!Number.isFinite(level) || level <= 0) return null
    return Math.round(surface * priceM2 * level)
  }

  const handleSyncToFirebase = async () => {
    try {
      setSyncLoading(true)
      setSyncSuccess('')
      setError('')

      const response = await fetch(`/api/signalements/${signalement.id}/sync/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la synchronisation vers Firebase')
      }

      setSyncSuccess('✓ Synchronisé vers Firebase avec succès')
      setTimeout(() => setSyncSuccess(''), 3000)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setSyncLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>{signalement.title}</h2>
          <div
            className="status-badge"
            style={{ backgroundColor: statusColors[signalement.status] || '#95a5a6' }}
          >
            {signalement.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <div className="modal-body">
          <div className="detail-row">
            <label>Description:</label>
            <p>{signalement.description}</p>
          </div>

          <div className="detail-row">
            <label>Localisation:</label>
            <p>
              Latitude: {signalement.lat.toFixed(4)} | Longitude: {signalement.lon.toFixed(4)}
            </p>
          </div>

          <div className="detail-row">
            <label>Type:</label>
            <p>{signalement.title}</p>
          </div>

          <div className="detail-row">
            <label>Date de création:</label>
            <p>{signalement.date ? new Date(signalement.date).toLocaleDateString('fr-FR') : 'N/A'}</p>
          </div>

          {signalement.work && (
            <>
              <hr />
              <h3>📋 Réparation</h3>
              <div className="detail-row">
                <label>Surface (m²):</label>
                <p>{signalement.work.surface || 'N/A'}</p>
              </div>
              <div className="detail-row">
                <label>Niveau de réparation:</label>
                <p>{signalement.work.reparationType?.niveau ?? 'N/A'}</p>
              </div>
              <div className="detail-row">
                <label>Entreprise:</label>
                <p>{signalement.work.company || 'N/A'}</p>
              </div>
              <div className="detail-row">
                <label>Date de début:</label>
                <p>{signalement.work.startDate || 'N/A'}</p>
              </div>
              <div className="detail-row">
                <label>Date estimée:</label>
                <p>{signalement.work.endDateEstimation || 'N/A'}</p>
              </div>
              <div className="detail-row">
                <label>Date réelle:</label>
                <p>{signalement.work.realEndDate || 'En cours'}</p>
              </div>
              <div className="detail-row">
                <label>Budget:</label>
                <p>${signalement.work.price ? parseFloat(signalement.work.price).toFixed(2) : 'N/A'}</p>
              </div>
            </>
          )}

          {/* Formulaire de réparation pour les signalements "nouveau" */}
          {isManager && signalement.status === 'nouveau' && !signalement.work && (
            <>
              <hr />
              <h3>➕ Ajouter une réparation</h3>
              {showWorkForm ? (
                <div className="work-form">
                  <div className="form-group">
                    <label htmlFor="surface">Surface (m²):</label>
                    <input
                      id="surface"
                      type="number"
                      step="0.01"
                      value={formData.surface}
                      onChange={(e) => handleFormChange('surface', e.target.value)}
                      placeholder="Ex: 25.50"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="company">Entreprise:</label>
                    {loadingCompanies ? (
                      <p className="form-input" style={{ color: '#666', fontStyle: 'italic' }}>
                        ⏳ Chargement des entreprises...
                      </p>
                    ) : companies.length > 0 ? (
                      <select
                        id="company"
                        value={formData.companyId}
                        onChange={(e) => handleFormChange('companyId', e.target.value)}
                        className="form-input"
                      >
                        <option value="">-- Sélectionner une entreprise --</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="form-input" style={{ color: '#e74c3c', fontStyle: 'italic' }}>
                        ❌ Aucune entreprise disponible
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reparationType">Niveau de réparation:</label>
                    {loadingReparationTypes ? (
                      <p className="form-input" style={{ color: '#666', fontStyle: 'italic' }}>
                        ⏳ Chargement des niveaux...
                      </p>
                    ) : (
                      <select
                        id="reparationType"
                        value={formData.reparationTypeId}
                        onChange={(e) => handleFormChange('reparationTypeId', e.target.value)}
                        className="form-input"
                      >
                        <option value="">-- Sélectionner un niveau --</option>
                        {(reparationTypes.length > 0
                          ? reparationTypes
                          : Array.from({ length: 10 }, (_, index) => ({ id: index + 1, niveau: index + 1 }))
                        ).map((type) => (
                          <option key={type.id} value={type.id}>
                            Niveau {type.niveau}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="startDate">Date de début:</label>
                    <input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleFormChange('startDate', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDate">Date estimée:</label>
                    <input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleFormChange('endDate', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="price">Budget (Ar):</label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      placeholder="Optionnel (auto si vide)"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Estimation (auto):</label>
                    <p className="form-input" style={{ color: '#666', fontStyle: 'italic' }}>
                      {loadingDefaultPrice ? (
                        '⏳ Chargement du prix forfaitaire…'
                      ) : estimateBudget() != null ? (
                        `≈ ${estimateBudget().toLocaleString('fr-FR')} Ar (prix: ${Number(defaultPrice).toLocaleString('fr-FR')} Ar/m²)`
                      ) : defaultPrice == null ? (
                        '— (prix forfaitaire non défini)'
                      ) : (
                        '— (saisissez une surface et un niveau)'
                      )}
                    </p>
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <div className="form-actions">
                    <button
                      className="action-button success"
                      onClick={handleSubmitWork}
                      disabled={loading}
                    >
                      {loading ? '⏳ Traitement...' : '✓ Ajouter et passer en cours'}
                    </button>
                    <button
                      className="action-button cancel"
                      onClick={() => setShowWorkForm(false)}
                      disabled={loading}
                    >
                      ✕ Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="action-button primary"
                  onClick={() => setShowWorkForm(true)}
                >
                  ➕ Ajouter une réparation
                </button>
              )}
            </>
          )}
        </div>

        {isManager && signalement.status !== 'nouveau' && (
          <div className="modal-actions">
            {!showStatusEdit ? (
              <button
                className="action-button primary"
                onClick={() => setShowStatusEdit(true)}
              >
                ✏️ Modifier le statut
              </button>
            ) : (
              <div className="status-edit">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="status-select"
                >
                  {statusOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedStatus === 'terminé' && (
                  <div className="date-input-group">
                    <label htmlFor="realEndDate">Date réelle de fin :</label>
                    <input
                      id="realEndDate"
                      type="date"
                      value={realEndDate}
                      onChange={(e) => setRealEndDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                )}
                <div className="edit-buttons">
                  <button
                    className="action-button success"
                    onClick={handleStatusUpdate}
                    disabled={loading}
                  >
                    {loading ? 'Mise à jour...' : '✓ Confirmer'}
                  </button>
                  <button
                    className="action-button cancel"
                    onClick={() => {
                      setShowStatusEdit(false)
                      setSelectedStatus(signalement.status)
                    }}
                    disabled={loading}
                  >
                    ✕ Annuler
                  </button>
                </div>
                {error && <div className="error-message">{error}</div>}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          {isManager && (
            <>
              <button
                className="action-button primary"
                onClick={handleSyncToFirebase}
                disabled={syncLoading}
                style={{ marginRight: '10px' }}
              >
                {syncLoading ? '⏳ Synchronisation...' : '🔄 Synchroniser vers Firebase'}
              </button>
              {syncSuccess && <span className="success-message">{syncSuccess}</span>}
            </>
          )}
          <button className="close-modal-button" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
