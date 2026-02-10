import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: ''
  })
  const [creating, setCreating] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editData, setEditData] = useState({
    password: '',
    role: ''
  })
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncingStatus, setSyncingStatus] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur ${response.status}: ${text || 'Erreur lors du chargement des rôles'}`)
      }
      const data = await response.json()
      setRoles(data)
      if (data.length > 0) {
        setNewUser(prev => ({ ...prev, role: data[0].libelle }))
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création')
      }

      setSuccess(`Utilisateur "${data.username}" créé avec succès`)
      setShowModal(false)
      setNewUser({ username: '', password: '', role: roles[0]?.libelle || '' })
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setEditData({
      password: '',
      role: user.role
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const updatePayload = {
        role: editData.role
      }
      
      // Ajouter le mot de passe seulement s'il est rempli
      if (editData.password && editData.password.trim()) {
        updatePayload.password = editData.password
      }

      const response = await fetch(`/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour')
      }

      setSuccess(`Utilisateur "${editingUser.username}" modifié avec succès`)
      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleUnlockUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir débloquer cet utilisateur ?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/auth/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du déverrouillage')
      }

      setSuccess(`Utilisateur déverrouillé avec succès`)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSyncWithMobile = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir synchroniser avec les utilisateurs mobile (Firebase)? Cette action importera les nouveaux utilisateurs et mettra à jour les statuts.')) {
      return
    }

    setSyncing(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/import-firebase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la synchronisation')
      }

      setSuccess(data.message || 'Synchronisation avec mobile réussie')
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncStatusToMobile = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir envoyer les modifications de statut (bloqué/débloqué) vers Firebase?')) {
      return
    }

    setSyncingStatus(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/sync-status-to-firebase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la synchronisation des statuts')
      }

      setSuccess(data.message || 'Statuts envoyés vers mobile avec succès')
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncingStatus(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="users-container">
      <header className="users-header">
        <div className="header-left">
          <h1>Gestion des Utilisateurs</h1>
        </div>
        <div className="header-right">
          <button onClick={() => navigate('/dashboard')} className="logout-button">
            Dashboard
          </button>
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="users-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="users-toolbar">
          <button onClick={() => setShowModal(true)} className="create-button">
            + Créer un utilisateur
          </button>
          <button 
            onClick={handleSyncWithMobile} 
            className="import-button"
            disabled={syncing}
          >
            {syncing ? '⏳ Synchronisation...' : '📥 Synchroniser'}
          </button>
          <button 
            onClick={handleSyncStatusToMobile} 
            className="export-button"
            disabled={syncingStatus}
          >
            {syncingStatus ? '⏳ Envoi...' : '📤 Envoyer Statuts vers Mobile'}
          </button>
        </div>

        {loading ? (
          <div className="loading">Chargement...</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom d'utilisateur</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.isLocked ? (
                        <span className="status-badge status-locked">Bloqué</span>
                      ) : user.isActive ? (
                        <span className="status-badge status-active">Actif</span>
                      ) : (
                        <span className="status-badge status-inactive">Inactif</span>
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="action-button edit-button"
                        title="Modifier l'utilisateur"
                      >
                        ✏️ Modifier
                      </button>
                      {user.isLocked && (
                        <button 
                          onClick={() => handleUnlockUser(user.id)}
                          className="action-button unlock-button"
                          title="Débloquer l'utilisateur"
                        >
                          🔓 Débloquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer un utilisateur</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label htmlFor="username">Nom d'utilisateur</label>
                <input
                  type="email"
                  id="username"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Entrez le nom d'utilisateur"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Entrez le mot de passe"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Rôle</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.libelle}>
                      {role.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-create" disabled={creating}>
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier l'utilisateur: {editingUser.username}</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="modal-form">
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="form-input-disabled"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-password">Mot de passe (laisser vide pour ne pas modifier)</label>
                <input
                  type="password"
                  id="edit-password"
                  value={editData.password}
                  onChange={e => setEditData({ ...editData, password: e.target.value })}
                  placeholder="Nouveau mot de passe (optionnel)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-role">Rôle</label>
                <select
                  id="edit-role"
                  value={editData.role}
                  onChange={e => setEditData({ ...editData, role: e.target.value })}
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.libelle}>
                      {role.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-create" disabled={updating}>
                  {updating ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
