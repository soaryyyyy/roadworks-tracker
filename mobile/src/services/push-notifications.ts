import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { firestore, auth } from '@/services/firebase/routeworks-tracker';

// Token FCM en memoire pour le sauvegarder apres login
let pendingFcmToken: string | null = null;

/**
 * Enregistrer l'appareil pour les push notifications FCM
 * et stocker le token dans Firestore pour que le backend puisse envoyer des notifications
 */
export const registerPushNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Push notifications disponibles uniquement sur plateforme native');
    return;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Permissions push notifications refusees');
      return;
    }

    await PushNotifications.register();
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement push:', error);
  }
};

/**
 * Stocker le token FCM dans Firestore (collection fcm_tokens)
 * Le backend lit cette collection pour envoyer les push notifications
 */
const saveFcmToken = async (token: string): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    // L'utilisateur n'est pas encore connecte, on garde le token en attente
    pendingFcmToken = token;
    console.warn('Utilisateur non authentifie - token FCM en attente');
    return;
  }

  try {
    await setDoc(doc(firestore, 'fcm_tokens', userId), {
      token,
      updatedAt: serverTimestamp(),
    });
    pendingFcmToken = null;
    console.log('Token FCM sauvegarde pour userId:', userId);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token FCM:', error);
  }
};

/**
 * Configurer les listeners pour les push notifications FCM
 */
export const setupPushListeners = (): void => {
  if (!Capacitor.isNativePlatform()) return;

  // Token recu apres register()
  PushNotifications.addListener('registration', async (token) => {
    console.log('Token FCM recu:', token.value);
    await saveFcmToken(token.value);
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Erreur d\'enregistrement FCM:', error);
  });

  // Notification recue quand l'app est au premier plan
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification recue (foreground):', notification);
  });

  // L'utilisateur a clique sur la notification
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification cliquee:', notification);
  });

  // Quand l'utilisateur se connecte, sauvegarder le token en attente
  onAuthStateChanged(auth, async (user) => {
    if (user && pendingFcmToken) {
      console.log('Utilisateur connecte - sauvegarde du token FCM en attente');
      await saveFcmToken(pendingFcmToken);
    }
  });
};
