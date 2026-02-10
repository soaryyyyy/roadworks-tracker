<template>
  <ion-page class="auth-page">
    <ion-content class="auth-container">

      <div class="auth-header">
        <div class="auth-logo"></div>
        <h1>Connexion</h1>
        <p>Accédez à votre compte Roadworks</p>
      </div>

      <div class="auth-form">
        <!-- Email -->
        <div class="form-group">
          <label class="form-label">Email</label>
          <ion-item lines="none">
            <ion-input
              type="email"
              placeholder="exemple@mail.fr"
              v-model="email"
              :readonly="awaitSignIn">
            </ion-input>
          </ion-item>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <ion-item lines="none">
            <ion-input
              type="password"
              placeholder="Votre mot de passe"
              v-model="password"
              :readonly="awaitSignIn">
            </ion-input>
          </ion-item>
        </div>

        <!-- Error card -->
        <div v-if="errors.displayErrorCard" class="error-card">
          <div class="error-card__title">{{ errors.errorCardTitle }}</div>
          <div class="error-card__content">{{ errors.errorCardContent }}</div>
        </div>

        <!-- Simple error message -->
        <div v-if="errors.simpleErrorMessage.length > 0" class="error-message">
          <small v-html="errors.simpleErrorMessage"></small>
        </div>

        <!-- Sign in button -->
        <ion-button
          expand="block"
          @click="handleSignIn"
          :disabled="isSignInButtonDisabled"
          class="mt-lg">
          <ion-spinner v-if="awaitSignIn" name="crescent"></ion-spinner>
          <span v-else>Se connecter</span>
        </ion-button>

        <!-- Sign up link -->
        <!-- <div class="auth-link">
          <span>Pas encore de compte ?</span>
          <a @click="goToSignUp">S'inscrire</a>
        </div> -->
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  IonPage, IonContent,
  IonItem, IonInput, IonButton,
  IonSpinner
} from '@ionic/vue';

import { alertCircleOutline, cloudOfflineOutline } from 'ionicons/icons';

import router from '@/router';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

import { auth } from '@/services/firebase/routeworks-tracker';
import {
  isAccountLocked,
  recordFailedAttempt,
  resetLoginAttempts
} from '@/services/firebase/auth-attempts';
import { showToast } from '@/utils/ui';
import { useConfigStore } from '@/pinia/firebase/routeworks-tracker';
import { useAuthSessionStore } from '@/pinia/auth/session';

// Input
const email = ref<string>('');
const password = ref<string>('');

// Disable button or not
const awaitSignIn = ref<boolean>(false);

const isSignInButtonDisabled = computed<boolean>(() => {
  return awaitSignIn.value || !email.value || !password.value;
})

// Error management
const errors = ref({
  simpleErrorMessage: '',
  errorCardTitle: '',
  errorCardContent: '',
  displayErrorCard: false,
});

const clearErrors = () => {
  errors.value.simpleErrorMessage = '';
  errors.value.errorCardTitle = '';
  errors.value.errorCardContent = '';
  errors.value.displayErrorCard = false;
};

const handleSignIn = async () => {
  clearErrors();
  awaitSignIn.value = true;
  try {
    // Vérifier si le compte est bloqué
    const locked = await isAccountLocked(email.value);
    if (locked) {
      errors.value.errorCardTitle = 'Compte bloqué';
      errors.value.errorCardContent =
        'Suite à trop de tentatives échouées, ce compte a été bloqué. Veuillez contacter l\'administrateur pour le débloquer.';
      errors.value.displayErrorCard = true;
      awaitSignIn.value = false;
      return;
    }

    await signInWithEmailAndPassword(auth, email.value, password.value);

    // Connexion réussie : réinitialiser les tentatives
    await resetLoginAttempts(email.value);

    const configStore = useConfigStore();
    const sessionExpiresAt = Date.now() + configStore.sessionDurationMillis;

    const authSessionStore = useAuthSessionStore();
    await authSessionStore.setSession(sessionExpiresAt);

    email.value = '';
    password.value = '';

    router.push('/');
  } catch (error) {
    if (error instanceof FirebaseError) {
      // Enregistrer la tentative échouée
      const result = await recordFailedAttempt(email.value);

      switch (error.code) {
        case 'auth/network-request-failed':
          showToast('Vérifiez votre accès internet.', 5000, cloudOfflineOutline, 'danger', 'bottom')
          break;

        case 'auth/user-disabled':
          errors.value.errorCardTitle = 'Compte suspendu';
          errors.value.errorCardContent = 'Il semblerai que ce compte a été suspendu.';
          errors.value.displayErrorCard = true;
          break;

        case 'auth/too-many-requests':
          errors.value.simpleErrorMessage =
            "Accès temporairement bloqué suite à trop d'échecs.<br>Réessayez dans quelques minutes.";
          break;

        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-email':
          const nbr_tentative = 3;
          const essai_restant = nbr_tentative - result.failedAttempts;
          if (result.isLocked) {
            errors.value.errorCardTitle = 'Compte bloqué';
            errors.value.errorCardContent =
              'Suite à trop de tentatives échouées, ce compte a été bloqué. Veuillez contacter l\'administrateur pour le débloquer.';
            errors.value.displayErrorCard = true;
          } else if (essai_restant > 0) {
            errors.value.simpleErrorMessage =
              `Identifiants incorrects.<br><strong>${essai_restant} tentative(s) restante(s)</strong> avant blocage du compte.`;
          } else {
            errors.value.simpleErrorMessage =
              "Veuillez vérifier votre e-mail et votre mot de passe.";
          }
          break;
      }
    } else {
      console.error(error);
      showToast('Une erreur inattendue est survenue', 5000, alertCircleOutline, 'danger', 'bottom')
    }
  } finally {
    awaitSignIn.value = false;
  }
}

const goToSignUp = () => {
  router.push('/auth/signUp');
}

</script>

<style scoped>
.auth-link {
  text-align: center;
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--neutral-gray-500);
}

.auth-link a {
  color: var(--primary-color);
  font-weight: 600;
  margin-left: var(--spacing-xs);
  cursor: pointer;
}

.error-card {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
}

.error-card__title {
  font-weight: 600;
  color: var(--status-danger);
  margin-bottom: var(--spacing-xs);
}

.error-card__content {
  font-size: var(--font-size-sm);
  color: var(--neutral-gray-600);
}
</style>
