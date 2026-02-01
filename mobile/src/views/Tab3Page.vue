<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="header-with-logo">
          <div class="header-logo"></div>
          <span class="header-title">Profil</span>
          <div class="header-spacer"></div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-avatar">
          <ion-icon :icon="personOutline"></ion-icon>
        </div>

        <div v-if="currentUser">
          <p class="profile-email">{{ currentUser.email }}</p>
          <p class="profile-id">ID: {{ currentUser.uid.substring(0, 12) }}...</p>
        </div>
        <div v-else>
          <p class="profile-email">Chargement...</p>
        </div>
      </div>

      <!-- Logout Button -->
      <ion-button expand="block" color="danger" class="mt-lg" @click="handleSignOut">
        <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
        Se déconnecter
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { logOutOutline, personOutline } from 'ionicons/icons';
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
    router.push('/auth/signIn');
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};
</script>

<style scoped>
.profile-card {
  background: var(--neutral-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  border: 1px solid var(--neutral-gray-100);
  margin-top: var(--spacing-md);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--neutral-gray-100);
  margin: 0 auto var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar ion-icon {
  font-size: 36px;
  color: var(--neutral-gray-400);
}

.profile-email {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--neutral-dark);
  margin-bottom: var(--spacing-xs);
}

.profile-id {
  font-size: var(--font-size-xs);
  color: var(--neutral-gray-400);
  margin: 0;
}
</style>
