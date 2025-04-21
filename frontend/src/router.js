// Router configuration for IRMA frontend

import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
// Comment out the store import since we're not using it anymore
// import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    // Removed requiresAuth to allow direct access
    meta: { }
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
    // Removed requiresAuth to allow direct access
    meta: { 
      title: 'Project Timesheets',
      description: 'Track time spent on projects with required comments for each entry'
    }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/Projects.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
  },
  {
    path: '/clients',
    name: 'Clients',
    component: () => import('../views/Clients.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/Reports.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
  },
  {
    path: '/invoices',
    name: 'Invoices',
    component: () => import('../views/Invoices.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/Resources.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/Users.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    // Removed requiresAuth to allow direct access
    meta: { }
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

// Modified navigation guards to always allow access
router.beforeEach((to, from, next) => {
  // Always proceed to the requested route
  next()
  
  /* Original authentication logic (commented out)
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
  */
})

export default router
