import { useState } from 'react'
import './SignalementDetailModal.css'

export default function SignalementDetailModal({ signalement, onClose, onStatusChange, isManager, token }) {
  const [showStatusEdit, setShowStatusEdit] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(signalement.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const statusOptions = [
    { id: 1, label: 'Nouveau', value: 'nouveau' },
    { id: 2, label: 'En cours', value: 'en_cours' },
    { id: 3, label: 'Résolu', value: 'resolu' },
    { id: 4, label: 'Rejeté', value: 'rejete' },
  ]

  const statusColors = {
    nouveau: '#fdcb6e',
    en_cours: '#e17055',
    resolu: '#27ae60',
    rejete: '#d63031',
  }

  const handleStatusUpdate = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/signalements/${signalement.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: selectedStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut')
      }

      onStatusChange(selectedStatus)
      setShowStatusEdit(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
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
        </div>

        {isManager && (
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

        <button className="close-modal-button" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
