<template>
  <ion-page>

    <ion-header>
      <ion-toolbar>
        <div style="display: flex; align-items: center; width: 100%; justify-content: space-between; padding: 0 var(--spacing-md);">
          <div style="width: 40px; height: 40px; background: url('/logo-clean.png') center / contain no-repeat;"></div>
          <ion-title style="flex-grow: 1; text-align: center; margin: 0;">Explorer</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="handleSignOut" color="danger">
              <ion-icon slot="icon-only" :icon="logOutOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" id="map-content">
      <ion-fab slot="fixed" horizontal="start" vertical="top">
        
        <ion-fab-button @click="handleLocate">
          <ion-spinner v-if="currentLocationStore.isRefreshingCoords" name="crescent"></ion-spinner>
          <ion-icon v-else :icon="locateOutline"></ion-icon>
        </ion-fab-button>
      
      </ion-fab>

      <ion-fab slot="fixed" horizontal="end" vertical="top">
        <div class="filter-chip" @click="toggleFilter" :class="{ active: showOnlyMyReports }">
          <ion-icon :icon="filterOutline"></ion-icon>
          <span>{{ showOnlyMyReports ? 'Mes signalements' : 'Tous' }}</span>
        </div>
      </ion-fab>

      <div id="map" style="height: 100%; width: 100%;"></div>

      <roadworks-report-modal
        :is-open="isReportModalOpen"
        :coords="selectedCoords"
        @close="isReportModalOpen = false"
        @submitted="handleReportSubmitted"
      />

      <roadworks-report-details-modal
        :is-open="isDetailsModalOpen"
        :report="selectedReport"
        @close="isDetailsModalOpen = false"
      />

    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { 
  IonPage, IonHeader, IonToolbar, 
  IonTitle, IonContent, loadingController,
  IonFab, IonFabButton,
  IonIcon, IonSpinner, IonButtons, IonButton
} from '@ionic/vue';

import { locateOutline, filterOutline, logOutOutline } from 'ionicons/icons';

import L from 'leaflet';
import { useCurrentLocationStore } from '@/pinia/geo-location/current-location';
import { useRoadworksReportStore } from '@/pinia/geo-location/roadworks-report';
import { useAuthSessionStore } from '@/pinia/auth/session';
import { auth } from '@/services/firebase/routeworks-tracker';
import { defaultMarker } from '@/components/geo-location/icon';
import RoadworksReportModal from '@/components/geo-location/RoadworksReportModal.vue';
import RoadworksReportDetailsModal from '@/components/geo-location/RoadworksReportDetailsModal.vue';
import { signOut } from 'firebase/auth';
import router from '@/router';
import {
  getStatusLabel,
  getStatusEmoji,
  getStatusIcon,
  getStatusHexColor,
  getReportStatusLabel,
  formatDateShort,
} from '@/utils/roadworks-utils';

const isGeoLocationModalOpen = ref<boolean>(false);
let map: L.Map | null = null;
let userLocation: L.Marker | null = null;

const isReportModalOpen = ref<boolean>(false);
const selectedCoords = ref<{ lat: number; lng: number } | null>(null);

const currentLocationStore = useCurrentLocationStore();
const reportStore = useRoadworksReportStore();

const showOnlyMyReports = ref<boolean>(false);

const isDetailsModalOpen = ref<boolean>(false);
const selectedReport = ref<any>(null);

const mountMap = async () => {
  const mapLoading = await loadingController.create({
    message: 'Chargement de la carte...',
    spinner: 'crescent',
    backdropDismiss: false,
  });

  await mapLoading.present();

  try {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      throw new Error('Élément map non trouvé');
    }

    map = L.map('map', {
      zoomControl: false
    }).setView([-18.9184607, 47.5211293], 11); // Antananarivo

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Utiliser l'événement 'click' de Leaflet correctement
    map.on('click', function(e: L.LeafletMouseEvent) {
      // Vérifier que le clic n'est pas sur un marqueur
      if ((e.target as any).options && (e.target as any).options.icon) {
        return;
      }

      console.log('🗺️ Clic sur la carte');
      console.log('📍 Coordonnées:', e.latlng);
      
      // Zoom sur le point cliqué
      map.setView([e.latlng.lat, e.latlng.lng], 17);
      
      selectedCoords.value = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      
      isReportModalOpen.value = true;
    });

  } catch (error) {
    console.error('❌ Erreur mountMap:', error);
  } finally {
    await mapLoading.dismiss();
  }
};

const handleLocate = async () => {
  await currentLocationStore.refreshCoords();

  // Recentrer la carte sur la position de l'utilisateur
  const coords = currentLocationStore.coords;
  if (coords && map) {
    map.setView([coords.lat, coords.lng], 15);
  }
}

const handleReportSubmitted = async () => {
  // Charger tous les signalements et les afficher sur la carte
  console.log('📍 Signalement soumis, chargement des données...');
  await reportStore.loadAllReports();
  displayReportsOnMap();
}

const toggleFilter = () => {
  showOnlyMyReports.value = !showOnlyMyReports.value;
  console.log('🔄 Filtre toggled:', showOnlyMyReports.value);
  displayReportsOnMap();
}

const handleSignOut = async () => {
  const authStore = useAuthSessionStore();
  await authStore.clearSession();
  await signOut(auth);
  router.push('/auth/signIn');
}


const displayReportsOnMap = () => {
  if (!map) return;

  // Supprimer TOUS les marqueurs (sauf la position utilisateur)
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker && layer !== userLocation) {
      map?.removeLayer(layer);
    }
  });

  // Déterminer quels signalements afficher
  let reportsToDisplay = reportStore.reports;
  
  if (showOnlyMyReports.value) {
    reportsToDisplay = reportStore.reports.filter(r => r.userId === reportStore.currentUserId);
    console.log(`🔒 Filtre activé - Affichage mes signalements seulement`);
    console.log(`👤 Mon ID: ${reportStore.currentUserId}`);
    console.log(`📊 Mes signalements: ${reportsToDisplay.length}`);
  } else {
    console.log(`🌍 Tous les signalements`);
    console.log(`📊 Total: ${reportsToDisplay.length}`);
  }

  // Ajouter les marqueurs
  reportsToDisplay.forEach((report) => {
    const statusColor = getStatusHexColor(report.status);
    const markerHtml = getStatusIcon(report.status, statusColor);
    
    const svgMarkerIcon = L.divIcon({
      html: markerHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: 'emoji-marker',
    });

    const marker = L.marker([report.lat, report.lng], {
      icon: svgMarkerIcon,
    }).addTo(map!);

    const work = (report as any).work;
    const popupContent = `
      <div style="text-align: center; padding: 8px; width: 150px;">
        <strong>${getStatusLabel(report.status)}</strong>
        ${report.description ? `<p style="margin: 4px 0; font-size: 12px;">${report.description}</p>` : ''}
        <div style="margin-top: 6px; font-size: 12px; text-align: left;">
          <div><strong>Date:</strong> ${formatDateShort((report as any).createdAt)}</div>
          <div><strong>Statut:</strong> ${getReportStatusLabel((report as any).reportStatus || 'new')}</div>
          <div><strong>Surface:</strong> ${work?.surface != null ? `${work.surface} m²` : '—'}</div>
          <div><strong>Prix:</strong> ${work?.price != null ? `${Number(work.price).toLocaleString()} Ar` : '—'}</div>
          <div><strong>Entreprise:</strong> ${work?.company || '—'}</div>
        </div>
        <small style="color: #999;">
          ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}
        </small>
      </div>
    `;

    marker.bindPopup(popupContent);
    
    // Ajouter le clic pour afficher les détails
    marker.on('click', () => {
      console.log('📖 Clic sur marqueur:', report);
      // Zoom sur le marqueur
      map?.setView([report.lat, report.lng], 17);
      selectedReport.value = report;
      isDetailsModalOpen.value = true;
    });
  });

  console.log(`✅ ${reportsToDisplay.length} marqueurs affichés`);
};

watch(
  () => currentLocationStore.coords,
  (coords) => { 
    if (!coords) {
      return;
    }

    const { lat, lng } = coords; 
    if (!userLocation && map) {
      userLocation = L.marker([lat, lng]).addTo(map);
      userLocation.bindPopup(
        '<div style="text-align: center;font-weight: bold;">Vous</div>', 
        { closeButton: false }
      );
      userLocation.openPopup();
    } else if (userLocation && map){
      userLocation.setLatLng([lat, lng]);
    }
  },
  { deep: true }
)

onMounted(async () => {
  // Make leaflet use the default icon for marker
  L.Marker.prototype.options.icon = defaultMarker;
  await mountMap();
  
  // Charger les signalements depuis Firebase
  console.log('📍 Chargement des signalements...');
  await reportStore.loadAllReports();
  displayReportsOnMap();
});
</script>

<style scoped>
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.active {
  background: var(--ion-color-primary);
  color: #fff;
}

.filter-chip ion-icon {
  font-size: 18px;
}
</style>
