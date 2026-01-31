<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div style="display: flex; align-items: center; width: 100%; justify-content: space-between; padding: 0 var(--spacing-md);">
          <div style="width: 40px; height: 40px; background: url('/logo-clean.png') center / contain no-repeat;"></div>
          <ion-title style="flex-grow: 1; text-align: center; margin: 0;">
            <ion-icon :icon="lockClosedOutline" style="margin-right: 8px;"></ion-icon>Admin
          </ion-title>
          <div style="width: 40px;"></div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      
      <!-- Stats -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="statsChartOutline" style="margin-right: 8px;"></ion-icon>Statistiques
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>
                <h2>Total Bloqués</h2>
              </ion-label>
              <ion-badge slot="end" color="danger">{{ blockedAccounts.length }}</ion-badge>
            </ion-item>
            <ion-item>
              <ion-label>
                <h2>Dernière vérification</h2>
              </ion-label>
              <ion-text slot="end">{{ lastRefreshTime }}</ion-text>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Refresh Button -->
      <ion-button expand="block" @click="refreshBlockedAccounts" class="ion-margin-top">
        <ion-icon slot="start" :icon="refreshOutline"></ion-icon>Rafraîchir
      </ion-button>

      <!-- Search/Filter -->
      <ion-item class="ion-margin-top" lines="none">
        <ion-input 
          placeholder="Chercher un email..."
          v-model="searchEmail"
          @input="filterAccounts">
        </ion-input>
      </ion-item>

      <!-- Loading -->
      <ion-spinner v-if="loading" name="crescent" class="ion-margin-top"></ion-spinner>

      <!-- Comptes Bloqués -->
      <div v-if="!loading && filteredAccounts.length > 0" class="ion-margin-top">
        <ion-card v-for="account in filteredAccounts" :key="account.email">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="lockClosedOutline" color="danger"></ion-icon>
              {{ account.email }}
            </ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label>Tentatives échouées</ion-label>
                <ion-badge slot="end" color="danger">{{ account.failedAttempts }}/3</ion-badge>
              </ion-item>
              <ion-item>
                <ion-label>Bloqué depuis</ion-label>
                <ion-text slot="end">{{ formatDate(account.lockedAt) }}</ion-text>
              </ion-item>
              <ion-item>
                <ion-label>Dernière tentative</ion-label>
                <ion-text slot="end">{{ formatDate(account.lastFailedAttempt) }}</ion-text>
              </ion-item>
            </ion-list>

            <!-- Actions -->
            <div class="action-buttons">
              <ion-button 
                color="warning" 
                @click="unlockAccountAction(account.email)"
                expand="block">
                <ion-icon slot="start" :icon="lockOpenOutline"></ion-icon>Débloquer
              </ion-button>
              <ion-button 
                color="medium" 
                @click="resetAccountAction(account.email)"
                expand="block">
                <ion-icon slot="start" :icon="refreshOutline"></ion-icon>Réinitialiser
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Aucun résultat -->
      <ion-card v-if="!loading && filteredAccounts.length === 0" color="success">
        <ion-card-header>
          <ion-card-title>✅ Aucun compte bloqué</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          Excellent ! Tous les comptes sont débloqués.
        </ion-card-content>
      </ion-card>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonContent,
  IonToolbar, IonTitle, IonText,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonSpinner, IonBadge,
  IonItem, IonLabel, IonList, IonInput,
  alertController
} from '@ionic/vue';

import { lockClosed } from 'ionicons/icons';
import { firestore } from '@/services/firebase/routeworks-tracker';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { unlockAccount } from '@/services/firebase/auth-attempts';
import { lockClosedOutline, lockOpenOutline, refreshOutline, statsChartOutline } from 'ionicons/icons';

interface BlockedAccount {
  email: string;
  failedAttempts: number;
  isLocked: boolean;
  lockedAt: Timestamp | null;
  lastFailedAttempt: Timestamp | null;
}

const blockedAccounts = ref<BlockedAccount[]>([]);
const filteredAccounts = computed(() => {
  if (!searchEmail.value) return blockedAccounts.value;
  return blockedAccounts.value.filter(acc => 
    acc.email.toLowerCase().includes(searchEmail.value.toLowerCase())
  );
});
const searchEmail = ref<string>('');
const loading = ref<boolean>(false);
const lastRefreshTime = ref<string>('--:--');

const formatDate = (date: Timestamp | null): string => {
  if (!date) return 'N/A';
  const d = date.toDate();
  return d.toLocaleString('fr-FR');
};

const refreshBlockedAccounts = async () => {
  loading.value = true;
  try {
    const q = query(
      collection(firestore, 'loginAttempts'),
      where('isLocked', '==', true)
    );
    
    const snapshot = await getDocs(q);
    blockedAccounts.value = snapshot.docs.map(doc => ({
      email: doc.id,
      ...doc.data()
    } as BlockedAccount));

    // Mettre à jour l'heure
    const now = new Date();
    lastRefreshTime.value = now.toLocaleTimeString('fr-FR');

    console.log(`📊 ${blockedAccounts.value.length} compte(s) bloqué(s) trouvé(s)`);
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes bloqués:', error);
  } finally {
    loading.value = false;
  }
};

const unlockAccountAction = async (email: string) => {
  const alert = await alertController.create({
    header: 'Débloquer le compte',
    message: `Êtes-vous sûr de vouloir débloquer ${email} ?`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Débloquer',
        handler: async () => {
          try {
            await unlockAccount(email);
            await refreshBlockedAccounts();
            const successAlert = await alertController.create({
              header: '✅ Succès',
              message: `${email} a été débloqué`,
              buttons: ['OK']
            });
            await successAlert.present();
          } catch (error) {
            console.error('Erreur:', error);
          }
        }
      }
    ]
  });
  await alert.present();
};

const resetAccountAction = async (email: string) => {
  const alert = await alertController.create({
    header: 'Réinitialiser le compte',
    message: `Êtes-vous sûr de vouloir réinitialiser ${email} ?`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Réinitialiser',
        handler: async () => {
          try {
            await deleteDoc(doc(firestore, 'loginAttempts', email));
            await refreshBlockedAccounts();
            const successAlert = await alertController.create({
              header: '✅ Succès',
              message: `${email} a été réinitialisé`,
              buttons: ['OK']
            });
            await successAlert.present();
          } catch (error) {
            console.error('Erreur:', error);
          }
        }
      }
    ]
  });
  await alert.present();
};

const filterAccounts = () => {
  // Le filtre est géré par le computed
};

onMounted(() => {
  refreshBlockedAccounts();
});
</script>

<style scoped>
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
</style>
