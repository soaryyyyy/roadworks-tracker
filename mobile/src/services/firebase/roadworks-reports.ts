import { firestore, auth } from './routeworks-tracker';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
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

    const docRef = await addDoc(collection(firestore, 'roadworks_reports'), {
      ...report,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...report,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
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
