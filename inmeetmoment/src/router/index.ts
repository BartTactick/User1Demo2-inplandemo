import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/inplannen',
      component: () => import('../layouts/default.vue'),
      children: [
        {
          path: ':id',
          component: () => import('../pages/inplannen.vue'),
        },
      ],
    },
  ],
})

export default router
