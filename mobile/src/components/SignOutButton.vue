<template>
  <ion-button @click="handleSignOut">
    <ion-icon slot="icon-only" :icon="logInOutline"></ion-icon>
  </ion-button>
</template>

<script setup lang="ts">
import { auth } from '@/services/firebase/routeworks.tracker';
import { IonButton, IonIcon } from '@ionic/vue';
import { logInOutline } from 'ionicons/icons';

import { signOut } from 'firebase/auth';
import { setSessionExpirationDate } from '@/services/session/preference';

const handleSignOut = async () => {
  await signOut(auth);
  await setSessionExpirationDate(Date.now());
}
</script>