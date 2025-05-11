// Router configuration for IRMA frontend

import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/timesheets',
    name: 'Timesheets',
    component: () => import('../views/Timesheets.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/Projects.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/clients',
    name: 'Clients',
    component: () => import('../views/Clients.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/Reports.vue'),
    meta: { requiresAuth: true, permissions: ['view_reports'] }
  },
  {
    path: '/invoices',
    name: 'Invoices',
    component: () => import('../views/Invoices.vue'),
    meta: { requiresAuth: true, permissions: ['view_invoices'] }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/Resources.vue'),
    meta: { requiresAuth: true, permissions: ['view_resources'] }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/Users.vue'),
    meta: { requiresAuth: true, permissions: ['view_users'] }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true, permissions: ['manage_settings'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters['auth/isAuthenticated']
  
  // Routes that require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      // Check for required permissions
      if (to.meta.permissions) {
        const hasPermission = to.meta.permissions.some(permission => 
          store.getters['auth/hasPermission'](permission)
        )
        
        if (!hasPermission) {
          next({ path: '/' }) // Redirect to home if lacking permission
        } else {
          next()
        }
      } else {
        next()
      }
    }
  } 
  // Routes for guests only (like login)
  else if (to.matched.some(record => record.meta.guest)) {
    if (isLoggedIn) {
      next({ path: '/' })
    } else {
      next()
    }
  } 
  // Public routes
  else {
    next()
  }
})

export default router
