import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './PhotosPage.css'

export default function PhotosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/signalements/${id}/photos`)
        if (!response.ok) {
          throw new Error('Signalement non trouvé')
        }
        const data = await response.json()
        setPhotos(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [id])

  const handleBack = () => {
    navigate('/')
  }

  const openModal = (photo) => {
    setSelectedPhoto(photo)
  }

  const closeModal = () => {
    setSelectedPhoto(null)
  }

  if (loading) {
    return (
      <div className="photos-page">
        <div className="photos-header">
          <button className="back-button" onClick={handleBack}>
            ← Retour
          </button>
          <h1>Photos du signalement #{id}</h1>
        </div>
        <div className="loading">Chargement des photos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="photos-page">
        <div className="photos-header">
          <button className="back-button" onClick={handleBack}>
            ← Retour
          </button>
          <h1>Photos du signalement #{id}</h1>
        </div>
        <div className="error">Erreur: {error}</div>
      </div>
    )
  }

  return (
    <div className="photos-page">
      <div className="photos-header">
        <button className="back-button" onClick={handleBack}>
          ← Retour
        </button>
        <h1>Photos du signalement #{id}</h1>
      </div>

      {photos.length === 0 ? (
        <div className="no-photos">
          <p>Aucune photo disponible pour ce signalement.</p>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="photo-card"
              onClick={() => openModal(photo)}
            >
              <img
                src={photo.photoData}
                alt={`Photo ${photo.photoOrder || index + 1}`}
                className="photo-thumbnail"
              />
              <div className="photo-info">
                <span className="photo-number">Photo {photo.photoOrder || index + 1}</span>
                <span className="photo-date">
                  {new Date(photo.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
            <img
              src={selectedPhoto.photoData}
              alt={`Photo ${selectedPhoto.photoOrder}`}
              className="modal-image"
            />
            <div className="modal-info">
              <p>Photo {selectedPhoto.photoOrder}</p>
              <p>
                {new Date(selectedPhoto.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
