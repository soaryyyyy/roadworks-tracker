import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { auth } from '@/services/firebase/routeworks-tracker';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuthSessionStore } from '@/pinia/auth/session';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/tabs/map' },
  
  { 
    path: '/tabs/', 
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/map' },
      { path: 'map', component: () => import('@/views/geo-location/MapPage.vue') },
      { path: 'tab2', component: () => import('@/views/recap/RecapPage.vue') },
      { path: 'tab3', component: () => import('@/views/Tab3Page.vue') },
    ]
  },

  { path: '/auth/signIn', component: () => import('@/views/auth/SignInPage.vue') },
  { path: '/test/blocking', component: () => import('@/views/TestBlockingPage.vue') },
  { path: '/admin/blocked-accounts', component: () => import('@/views/admin/AdminBlockedAccountsPage.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        reject(error);
      }
    );
  });
};


router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth) {
    const user = await getCurrentUser();
    const authSessionStore = useAuthSessionStore();
    const sessionExpired = authSessionStore.isExpired;

    if (user && !sessionExpired) {
      next();
    } else {
      next('/auth/signIn');
    }
  } else {
    next();
  }
});


export default router;
