import { firestore, auth } from './routeworks-tracker';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

export interface WorkData {
  company: string;
  companyId: number;
  startDate: string;
  endDateEstimation: string;
  realEndDate?: string | null;
  price: number;
  surface: number;
}

export interface RoadworksReportData {
  lat: number;
  lng: number;
  status: 'pothole' | 'blocked_road' | 'accident' | 'construction' | 'flooding' | 'debris' | 'poor_surface' | 'other';
  description?: string;
  photos?: string[]; // URLs ou base64 des photos
  reportStatus?: 'new' | 'in_progress' | 'completed'; // Statut du rapport
  surface?: number; // en m2
  budget?: number; // en devise locale
  company?: string; // Entreprise concernée
  work?: WorkData; // Informations sur les travaux assignés
  userId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RoadworksReportWithId extends RoadworksReportData {
  id: string;
}

/**
 * Supprimer les valeurs undefined d'un objet (Firestore ne les accepte pas)
 */
const removeUndefinedValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Ajouter un signalement à Firestore
 */
export const addRoadworksReport = async (
  report: Omit<RoadworksReportData, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<RoadworksReportWithId> => {
  try {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }

    // Nettoyer les valeurs undefined (Firestore ne les accepte pas)
    const cleanedReport = removeUndefinedValues(report);

    const docRef = await addDoc(collection(firestore, 'roadworks_reports'), {
      ...cleanedReport,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...cleanedReport,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as RoadworksReportWithId;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du signalement:', error);
    throw error;
  }
};

/**
 * Récupérer tous les signalements de Firestore
 */
export const getAllRoadworksReports = async (): Promise<RoadworksReportWithId[]> => {
  try {
    const q = query(collection(firestore, 'roadworks_reports'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as RoadworksReportWithId));
  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    throw error;
  }
};

/**
 * Récupérer les signalements de l'utilisateur actuel
 */
export const getCurrentUserReports = async (): Promise<RoadworksReportWithId[]> => {
  try {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }

    const q = query(
      collection(firestore, 'roadworks_reports'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as RoadworksReportWithId));
  } catch (error) {
    console.error('Erreur lors de la récupération des signalements utilisateur:', error);
    throw error;
  }
};

/**
 * Écouter les changements en temps réel sur les signalements de l'utilisateur
 * Retourne une fonction pour se désabonner
 */
export const subscribeToUserReports = (
  onUpdate: (reports: RoadworksReportWithId[]) => void,
  onStatusChange?: (report: RoadworksReportWithId, oldStatus: string | undefined, newStatus: string) => void
): Unsubscribe | null => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    console.warn('Utilisateur non authentifié - impossible de souscrire aux notifications');
    return null;
  }

  const q = query(
    collection(firestore, 'roadworks_reports'),
    where('userId', '==', userId)
  );

  // Cache pour détecter les changements de statut
  const statusCache: Map<string, string | undefined> = new Map();

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const reports: RoadworksReportWithId[] = [];

    snapshot.docChanges().forEach((change) => {
      const report = {
        id: change.doc.id,
        ...change.doc.data(),
      } as RoadworksReportWithId;

      // Détecter les changements de statut
      if (change.type === 'modified' && onStatusChange) {
        const oldStatus = statusCache.get(report.id);
        const newStatus = report.reportStatus;

        if (oldStatus !== newStatus && newStatus) {
          console.log(`📢 Statut changé pour ${report.id}: ${oldStatus} -> ${newStatus}`);
          onStatusChange(report, oldStatus, newStatus);
        }
      }

      // Mettre à jour le cache
      statusCache.set(report.id, report.reportStatus);
    });

    // Récupérer tous les documents actuels
    snapshot.docs.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      } as RoadworksReportWithId);
    });

    onUpdate(reports);
  }, (error) => {
    console.error('Erreur lors de l\'écoute des signalements:', error);
  });

  return unsubscribe;
};

/**
 * Écouter tous les signalements en temps réel (pour la carte)
 */
export const subscribeToAllReports = (
  onUpdate: (reports: RoadworksReportWithId[]) => void
): Unsubscribe => {
  const q = query(collection(firestore, 'roadworks_reports'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as RoadworksReportWithId));

    onUpdate(reports);
  }, (error) => {
    console.error('Erreur lors de l\'écoute des signalements:', error);
  });

  return unsubscribe;
};
