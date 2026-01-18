import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import { auth } from '@/services/firebase/routeworks.tracker';
import { onAuthStateChanged, User } from 'firebase/auth';
import { isSessionExpired } from '@/services/session/preference';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/tabs/tab1' },
  
  { 
    path: '/tabs/', 
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/tab1' },
      { path: 'tab1', component: () => import('@/views/Tab1Page.vue') },
      { path: 'tab2', component: () => import('@/views/Tab2Page.vue') },
      { path: 'tab3', component: () => import('@/views/Tab3Page.vue') },
    ]
  },

  { path: '/auth/signIn', component: () => import('@/views/auth/SignInPage.vue') },
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
    const sessionExpired = await isSessionExpired();

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
