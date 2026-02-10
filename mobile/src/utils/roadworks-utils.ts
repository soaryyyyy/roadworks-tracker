/**
 * Utilitaires partagés pour les signalements de travaux routiers
 */

// Types de statut de signalement
export type RoadworkStatus =
  | 'pothole'
  | 'blocked_road'
  | 'accident'
  | 'construction'
  | 'flooding'
  | 'debris'
  | 'poor_surface'
  | 'other';

export type ReportStatus = 'new' | 'in_progress' | 'completed';

/**
 * Retourne le label avec emoji pour un type de signalement
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pothole': return 'Nid-de-poule';
    case 'blocked_road': return 'Route barrée';
    case 'accident': return 'Accident';
    case 'construction': return 'Travaux';
    case 'flooding': return 'Inondation';
    case 'debris': return 'Débris';
    case 'poor_surface': return 'Mauvaise surface';
    case 'other': return 'Autre';
    default: return status;
  }
};

/**
 * Retourne une icone emoji pour un type de signalement (pour les markers)
 */
export const getStatusIcon = (status: string): string => {
  const emoji = getStatusEmoji(status);
  return `
    <div style="
      font-size: 28px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.2));
    ">
      ${emoji}
    </div>
  `;
};

/**
 * Retourne l'emoji pour un type de signalement
 */
export const getStatusEmoji = (status: string): string => {
  switch (status) {
    case 'pothole': return '🕳️';
    case 'blocked_road': return '🚧';
    case 'accident': return '🚨';
    case 'construction': return '🏗️';
    case 'flooding': return '💧';
    case 'debris': return '🪨';
    case 'poor_surface': return '⚠️';
    case 'other': return '❓';
    default: return '📍';
  }
};

/**
 * Retourne le label pour un statut de rapport (new, in_progress, completed)
 */
export const getReportStatusLabel = (status: string): string => {
  switch (status) {
    case 'new': return 'Nouveau';
    case 'in_progress': return 'En cours';
    case 'completed': return 'Terminé';
    default: return status;
  }
};

/**
 * Retourne la couleur Ionic pour un statut de rapport
 */
export const getReportStatusColor = (status: string): string => {
  switch (status) {
    case 'new': return 'primary';
    case 'in_progress': return 'warning';
    case 'completed': return 'success';
    default: return 'medium';
  }
};

/**
 * Convertit une valeur de date (Firestore Timestamp, Date, number) en objet Date
 */
const toDateObject = (date: any): Date | null => {
  if (!date) return null;

  if (date.toDate) {
    return date.toDate();
  } else if (date instanceof Date) {
    return date;
  } else if (typeof date === 'number') {
    return new Date(date);
  }

  return null;
};

/**
 * Formate une date en format court (DD/MM/YYYY)
 */
export const formatDateShort = (date: any): string => {
  const dateObj = toDateObject(date);
  if (!dateObj) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
};

/**
 * Formate une date en format long avec heure (DD mois YYYY, HH:MM)
 */
export const formatDateLong = (date: any): string => {
  const dateObj = toDateObject(date);
  if (!dateObj) return 'N/A';

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Formate une date simple (string ISO) en format lisible
 */
export const formatSimpleDate = (dateString: string): string => {
  if (!dateString) return 'N/A';

  const dateObj = new Date(dateString);

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};
