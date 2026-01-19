<template>
  <ion-button fill="clear" @click="handleSignOut">
    <ion-icon slot="icon-only" :icon="logInOutline" color="danger"></ion-icon>
  </ion-button>
</template>

<script setup lang="ts">
import { auth } from '@/services/firebase/routeworks.tracker';
import { IonButton, IonIcon } from '@ionic/vue';
import { logInOutline } from 'ionicons/icons';

import { signOut } from 'firebase/auth';
import { expireSession } from '@/services/session/preference';
import router from '@/router';

const handleSignOut = async () => {
  await expireSession();
  await signOut(auth);
  router.push('/auth/signIn');
}
</script>