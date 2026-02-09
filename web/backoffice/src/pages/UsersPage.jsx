import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BackofficeSidebar from '../components/BackofficeSidebar'

export default function UsersPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username')
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
        throw new Error(`Erreur ${response.status}: ${text || 'Erreur lors du chargement des rÃ´les'}`)
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
        throw new Error(data.message || 'Erreur lors de la crÃ©ation')
      }

      setSuccess(`Utilisateur "${data.username}" crÃ©Ã© avec succÃ¨s`)
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
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const primaryMenu = [
    { label: 'Tableau de bord', icon: 'Map', onClick: () => navigate('/dashboard'), path: '/dashboard' },
    { label: 'Analyses', icon: 'Stats', onClick: () => navigate('/analytics'), path: '/analytics' },
    { label: 'Utilisateurs', icon: 'Users', onClick: () => navigate('/users'), path: '/users', requiresManager: true },
  ]

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
        throw new Error(data.message || 'Erreur lors de la mise Ã  jour')
      }

      setSuccess(`Utilisateur "${editingUser.username}" modifiÃ© avec succÃ¨s`)
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
    if (!window.confirm('ÃŠtes-vous sÃ»r de vouloir dÃ©bloquer cet utilisateur ?')) {
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
        throw new Error(data.message || 'Erreur lors du dÃ©verrouillage')
      }

      setSuccess(`Utilisateur dÃ©verrouillÃ© avec succÃ¨s`)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSyncWithMobile = async () => {
    if (!window.confirm('ÃŠtes-vous sÃ»r de vouloir synchroniser avec les utilisateurs mobile (Firebase)? Cette action importera les nouveaux utilisateurs et mettra Ã  jour les statuts.')) {
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

      setSuccess(data.message || 'Synchronisation avec mobile rÃ©ussie')
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncStatusToMobile = async () => {
    if (!window.confirm('ÃŠtes-vous sÃ»r de vouloir envoyer les modifications de statut (bloquÃ©/dÃ©bloquÃ©) vers Firebase?')) {
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

      setSuccess(data.message || 'Statuts envoyÃ©s vers mobile avec succÃ¨s')
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
    <div className="dashboard-container users-shell">
      <div className="dashboard-layout">
        <BackofficeSidebar
          title="Menu principal"
          subtitle="Administration"
          username={username}
          role={role}
          primaryItems={primaryMenu}
          onLogout={handleLogout}
        />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="header-left">
              <div>
                <h1>Gestion des utilisateurs</h1>
                <p className="user-info">
                  Connecte en tant que: <strong>{username}</strong> ({role})
                </p>
              </div>
            </div>
          </header>

          <section className="users-content">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="users-toolbar">
              <button onClick={() => setShowModal(true)} className="create-button">
                + Creer un utilisateur
              </button>
              <button
                onClick={handleSyncWithMobile}
                className="import-button"
                disabled={syncing}
              >
                {syncing ? 'Synchronisation...' : 'Importer de mobile'}
              </button>
              <button
                onClick={handleSyncStatusToMobile}
                className="export-button"
                disabled={syncingStatus}
              >
                {syncingStatus ? 'Envoi...' : 'Envoyer statuts vers mobile'}
              </button>
            </div>

            {loading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Nom d'utilisateur</th>
                  <th>Role</th>
                  <th>Statut</th>
                  <th>Cree le</th>
                  <th>Actes</th>
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
                        <span className="status-badge status-locked">Bloque</span>
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
                        Modifier
                      </button>
                      {user.isLocked && (
                        <button 
                          onClick={() => handleUnlockUser(user.id)}
                          className="action-button unlock-button"
                          title="Debloquer l'utilisateur"
                        >
                          Debloquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>CrÃ©er un utilisateur</h2>
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
                <label htmlFor="role">RÃ´le</label>
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
                  {creating ? 'CrÃ©ation...' : 'CrÃ©er'}
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
                <label htmlFor="edit-role">RÃ´le</label>
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
                  {updating ? 'Mise Ã  jour...' : 'Mettre Ã  jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}




