// Main.js file for IRMA frontend

import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import store from './store'
import axios from 'axios'

// Configure axios
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api'
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global error handler
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Unauthorized, redirect to login
      store.dispatch('auth/logout')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

Vue.config.productionTip = false

// Global filters
Vue.filter('formatDate', function(value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleDateString()
})

Vue.filter('formatCurrency', function(value) {
  if (!value) return '$0.00'
  return '$' + parseFloat(value).toFixed(2)
})

Vue.filter('formatHours', function(value) {
  if (!value) return '0.0'
  return parseFloat(value).toFixed(1)
})

// Global mixins
Vue.mixin({
  methods: {
    hasPermission(permission) {
      return store.getters['auth/hasPermission'](permission)
    }
  }
})

// Initialize the app
new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
