const STORAGE_KEY = 'm2_forfaits'

export function loadM2Forfaits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveM2Forfaits(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function upsertM2Forfait({ id, niveau, prixM2 }) {
  const items = loadM2Forfaits()
  const next = [...items]

  if (id) {
    const index = next.findIndex((item) => item.id === id)
    if (index >= 0) {
      next[index] = { ...next[index], niveau, prixM2 }
    } else {
      next.push({ id, niveau, prixM2 })
    }
  } else {
    const nextId = next.length ? Math.max(...next.map((item) => item.id)) + 1 : 1
    next.push({ id: nextId, niveau, prixM2 })
  }

  next.sort((a, b) => a.niveau - b.niveau)
  saveM2Forfaits(next)
  return next
}

export function deleteM2Forfait(id) {
  const items = loadM2Forfaits()
  const next = items.filter((item) => item.id !== id)
  saveM2Forfaits(next)
  return next
}

