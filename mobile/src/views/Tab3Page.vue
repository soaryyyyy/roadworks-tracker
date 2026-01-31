<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div style="display: flex; align-items: center; width: 100%; justify-content: space-between; padding: 0 var(--spacing-md);">
          <div style="width: 40px; height: 40px; background: url('/logo-clean.png') center / contain no-repeat;"></div>
          <ion-title style="flex-grow: 1; text-align: center; margin: 0;">Profil</ion-title>
          <div style="width: 40px;"></div>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Profil</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Profile Card -->
      <ion-card style="margin-top: var(--spacing-lg);">
        <ion-card-header>
          <ion-card-title>Informations Utilisateur</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-text v-if="currentUser">
            <p style="color: var(--neutral-gray-600);">Connecté en tant que</p>
            <p style="font-weight: 500; font-size: 16px;">{{ currentUser.email }}</p>
            <p style="color: var(--neutral-gray-600); font-size: 12px; margin-top: 8px;">ID: {{ currentUser.uid }}</p>
          </ion-text>
          <ion-text v-else>
            <p style="color: var(--neutral-gray-600);">Chargement des informations...</p>
          </ion-text>
        </ion-card-content>
      </ion-card>

      <!-- Logout Button -->
      <ion-button expand="block" color="danger" style="margin-top: var(--spacing-lg);" @click="handleSignOut">
        <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
        Se déconnecter
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText, IonButton, IonIcon } from '@ionic/vue';
import { logOutOutline } from 'ionicons/icons';
import { auth } from '@/services/firebase/routeworks-tracker';
import { signOut } from 'firebase/auth';
import router from '@/router';

const currentUser = ref<any>(null);

onMounted(() => {
  if (auth.currentUser) {
    currentUser.value = auth.currentUser;
  }
});

const handleSignOut = async () => {
  try {
    await signOut(auth);
    console.log('✅ Déconnexion réussie');
    router.push('/sign-in');
  } catch (error) {
    console.error('❌ Erreur de déconnexion:', error);
  }
};
</script>
