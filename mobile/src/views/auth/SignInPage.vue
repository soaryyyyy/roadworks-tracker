<template>

<ion-page>
  <!-- Header -->
  <ion-header>
    <ion-toolbar>
      <ion-title>Se Connecter</ion-title>
    </ion-toolbar>
  </ion-header>

  <!-- Content-->
  <ion-content class="ion-padding">

    <ion-text color="primary">
      <h1>Heureux de vous revoir!</h1>
    </ion-text>

    <ion-text>
      <p>Saisissez vos identifiants pour continuer</p>
    </ion-text>
    
    <!-- Email -->
    <ion-item class="ion-margin-bottom" lines="none">
      <ion-input 
        type="email" 
        label="Email *"
        label-placement="stacked" 
        placeholder="exemple@mail.fr"
        v-model="email"
        :readonly="awaitSignIn">
      </ion-input>
    </ion-item>

    <!-- Pwd -->
    <ion-item class="ion-margin-bottom" lines="none">
      <ion-input 
        type="password"
        label="Mot de passe *"
        label-placement="stacked" 
        v-model="password"
        :readonly="awaitSignIn">
      </ion-input>
    </ion-item>

    <!-- Error card -->
    <ion-card v-if="errors.displayErrorCard">
      <ion-card-header>
        <ion-card-title color="danger">{{ errors.errorCardTitle }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        {{ errors.errorCardContent }}
      </ion-card-content>
    </ion-card>

    <!-- Simple error message -->
    <ion-text v-if="errors.simpleErrorMessage.length > 0"
      color="danger">
      <small v-html="errors.simpleErrorMessage"></small>
    </ion-text>

    <!-- Sign in button -->
    <ion-button 
      expand="block" 
      @click="handleSignIn" 
      :disabled="isSignInButtonDisabled">

      <ion-text v-if="!awaitSignIn">Se Connecter</ion-text>
      <ion-spinner v-else name="crescent"></ion-spinner>  
      <ion-icon v-if="!awaitSignIn" :icon="logInOutline" slot="end"></ion-icon>

    </ion-button>
  </ion-content>
</ion-page>

</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { 
  IonPage, IonHeader, IonContent, 
  IonToolbar, IonTitle, IonText,
  IonItem, IonInput, IonButton, 
  IonIcon, IonSpinner, IonCard, 
  IonCardTitle, IonCardContent, IonCardHeader
} from '@ionic/vue';

import { logInOutline, alertCircleOutline, cloudOfflineOutline } from 'ionicons/icons';

import router from '@/router';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

import { auth } from '@/services/firebase/routeworks-tracker';
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
    await signInWithEmailAndPassword(auth, email.value, password.value);
    
    const configStore = useConfigStore();
    const sessionExpiresAt = Date.now() + configStore.sessionDurationMillis;

    const authSessionStore = useAuthSessionStore();
    await authSessionStore.setSession(sessionExpiresAt);
    
    email.value = '';
    password.value = '';

    router.push('/');
  } catch (error) {
    if (error instanceof FirebaseError) {
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
          errors.value.simpleErrorMessage = 
          "Veuillez vérifier votre e-mail et votre mot de passe.";
          break;
      }
    } else {
      console.log(error);
      showToast('Une erreur inattendue est survenue', 5000, alertCircleOutline, 'danger', 'bottom')
    }
  } finally {
    awaitSignIn.value = false;
  }
}

</script>