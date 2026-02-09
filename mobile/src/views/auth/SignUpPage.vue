<template>
  <ion-page class="auth-page">
    <ion-content class="auth-container">

      <div class="auth-header">
        <div class="auth-logo"></div>
        <h1>Inscription</h1>
        <p>Créez votre compte Roadworks</p>
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
              :readonly="awaitSignUp">
            </ion-input>
          </ion-item>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <ion-item lines="none">
            <ion-input
              type="password"
              placeholder="Minimum 6 caractères"
              v-model="password"
              :readonly="awaitSignUp">
            </ion-input>
          </ion-item>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label class="form-label">Confirmer le mot de passe</label>
          <ion-item lines="none">
            <ion-input
              type="password"
              placeholder="Confirmez votre mot de passe"
              v-model="confirmPassword"
              :readonly="awaitSignUp">
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

        <!-- Sign up button -->
        <ion-button
          expand="block"
          @click="handleSignUp"
          :disabled="isSignUpButtonDisabled"
          class="mt-lg">
          <ion-spinner v-if="awaitSignUp" name="crescent"></ion-spinner>
          <span v-else>Créer mon compte</span>
        </ion-button>

        <!-- Sign in link -->
        <div class="auth-link">
          <span>Vous avez déjà un compte ?</span>
          <a @click="goToSignIn">Se connecter</a>
        </div>
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

import { checkmarkOutline, alertCircleOutline, cloudOfflineOutline } from 'ionicons/icons';

import router from '@/router';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

import { auth } from '@/services/firebase/routeworks-tracker';
import { showToast } from '@/utils/ui';

// Input
const email = ref<string>('');
const password = ref<string>('');
const confirmPassword = ref<string>('');

// Disable button or not
const awaitSignUp = ref<boolean>(false);

const isSignUpButtonDisabled = computed<boolean>(() => {
  return awaitSignUp.value || !email.value || !password.value || !confirmPassword.value;
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

const handleSignUp = async () => {
  clearErrors();

  // Validation
  if (password.value !== confirmPassword.value) {
    errors.value.simpleErrorMessage = 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (password.value.length < 6) {
    errors.value.simpleErrorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
    return;
  }

  awaitSignUp.value = true;
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);

    showToast('Compte créé avec succès !', 3000, checkmarkOutline, 'success', 'bottom');

    email.value = '';
    password.value = '';
    confirmPassword.value = '';

    setTimeout(() => {
      router.push('/auth/signIn');
    }, 1500);
  } catch (error) {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/network-request-failed':
          showToast('Vérifiez votre accès internet.', 5000, cloudOfflineOutline, 'danger', 'bottom')
          break;

        case 'auth/email-already-in-use':
          errors.value.errorCardTitle = 'Email déjà utilisé';
          errors.value.errorCardContent = 'Cet email est déjà associé à un compte. Veuillez utiliser un autre email ou vous connecter.';
          errors.value.displayErrorCard = true;
          break;

        case 'auth/invalid-email':
          errors.value.simpleErrorMessage = 'Veuillez entrer une adresse email valide.';
          break;

        case 'auth/weak-password':
          errors.value.simpleErrorMessage = 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
          break;

        default:
          errors.value.simpleErrorMessage = 'Une erreur est survenue lors de la création du compte.';
      }
    } else {
      console.error(error);
      showToast('Une erreur inattendue est survenue', 5000, alertCircleOutline, 'danger', 'bottom')
    }
  } finally {
    awaitSignUp.value = false;
  }
}

const goToSignIn = () => {
  router.push('/auth/signIn');
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
