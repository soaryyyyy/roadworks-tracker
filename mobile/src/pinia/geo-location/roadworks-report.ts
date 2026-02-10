import { defineStore } from 'pinia';
import { auth } from '@/services/firebase/routeworks-tracker';
import {
  addRoadworksReport,
  getAllRoadworksReports,
  subscribeToAllReports,
  subscribeToUserReports,
  RoadworksReportData,
  RoadworksReportWithId,
} from '@/services/firebase/roadworks-reports';
import { readRoadworksCache, saveRoadworksCache } from '@/services/cache/roadworks-cache';
import { showToast } from '@/utils/ui';
import { notifyStatusChange as sendNativeNotification } from '@/services/notifications';
import { alertCircleOutline, checkmarkCircleOutline, refreshCircleOutline, notificationsOutline } from 'ionicons/icons';
import type { Unsubscribe } from 'firebase/firestore';

export interface RoadworksReport extends RoadworksReportWithId {}

// Labels pour les statuts
const STATUS_LABELS: Record<string, string> = {
  'new': 'Nouveau',
  'in_progress': 'En cours',
  'completed': 'Terminé',
};

export const useRoadworksReportStore = defineStore('roadworks-report', {
  state: () => ({
    reports: [] as RoadworksReport[],
    isSubmitting: false,
    isLoading: false,
    error: null as string | null,
    currentUserId: null as string | null,
    unsubscribeAll: null as Unsubscribe | null,
    unsubscribeUser: null as Unsubscribe | null,
  }),

  actions: {
    async addReport(report: Omit<RoadworksReportData, 'userId' | 'createdAt' | 'updatedAt'>) {
      this.isSubmitting = true;
      this.error = null;

      try {
        const newReport = await addRoadworksReport(report);

        this.reports.push(newReport);
        this.currentUserId = newReport.userId || null;

        showToast('Signalement enregistré avec succès!', 2000, alertCircleOutline, 'success', 'top');

        return newReport;
      } catch (error: any) {
        const message = error?.message || 'Erreur lors de l\'enregistrement du signalement';
        this.error = message;

        showToast(message, 3000, alertCircleOutline, 'danger', 'top');

        throw error;
      } finally {
        this.isSubmitting = false;
      }
    },

    async loadAllReports(options?: { onCacheApplied?: () => void }) {
      this.isLoading = true;
      this.error = null;
      const onCacheApplied = options?.onCacheApplied;

      try {
        const cached = await readRoadworksCache();
        if (cached?.reports?.length) {
          this.reports = cached.reports;
          onCacheApplied?.();
        }

        // Récupérer l'ID utilisateur actuel
        const userId = auth.currentUser?.uid;
        if (userId) {
          this.currentUserId = userId;
        }

        this.reports = await getAllRoadworksReports();
        await saveRoadworksCache(this.reports);

        onCacheApplied?.();
      } catch (error: any) {
        const message = error?.message || 'Erreur lors du chargement des signalements';
        this.error = message;

        console.error('❌ Erreur:', message);

        if (this.reports.length) {
          showToast('Impossible d\'actualiser, utilisation des données en cache.', 3000, alertCircleOutline, 'warning', 'top');
        }
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * S'abonner aux mises à jour en temps réel de tous les signalements
     */
    subscribeToReports() {
      // Se désabonner si déjà abonné
      this.unsubscribeFromReports();

      // Récupérer l'ID utilisateur actuel
      const userId = auth.currentUser?.uid;
      if (userId) {
        this.currentUserId = userId;
      }

      // S'abonner à tous les signalements
      this.unsubscribeAll = subscribeToAllReports((reports) => {
        this.reports = reports;
      });

      // S'abonner aux signalements de l'utilisateur pour les notifications de statut
      if (userId) {
        this.unsubscribeUser = subscribeToUserReports(
          () => {}, // On utilise déjà subscribeToAllReports pour la mise à jour
          (report, oldStatus, newStatus) => {
            // Notification de changement de statut
            this.notifyStatusChange(report, oldStatus, newStatus);
          }
        );
      }

    },

    /**
     * Se désabonner des mises à jour
     */
    unsubscribeFromReports() {
      if (this.unsubscribeAll) {
        this.unsubscribeAll();
        this.unsubscribeAll = null;
      }
      if (this.unsubscribeUser) {
        this.unsubscribeUser();
        this.unsubscribeUser = null;
      }
    },

    /**
     * Notifier l'utilisateur d'un changement de statut
     * Envoie une notification native sur le téléphone + un toast in-app
     */
    async notifyStatusChange(report: RoadworksReportWithId, oldStatus: string | undefined, newStatus: string) {
      const newStatusLabel = STATUS_LABELS[newStatus] || newStatus;
      const oldStatusLabel = oldStatus ? (STATUS_LABELS[oldStatus] || oldStatus) : 'Inconnu';

      // Envoyer la notification native (apparaît même si l'app est en arrière-plan)
      await sendNativeNotification(report.id, report.description, oldStatus, newStatus);

      // Aussi afficher un toast si l'app est au premier plan
      let icon = notificationsOutline;
      let color: 'primary' | 'success' | 'warning' = 'primary';

      if (newStatus === 'completed') {
        icon = checkmarkCircleOutline;
        color = 'success';
      } else if (newStatus === 'in_progress') {
        icon = refreshCircleOutline;
        color = 'warning';
      }

      const description = report.description
        ? report.description.substring(0, 30) + (report.description.length > 30 ? '...' : '')
        : 'Votre signalement';

      showToast(
        `${description} : ${oldStatusLabel} → ${newStatusLabel}`,
        4000,
        icon,
        color,
        'top'
      );

    },

    clearError() {
      this.error = null;
    },
  },
});
