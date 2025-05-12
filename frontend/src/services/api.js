import axios from 'axios';

// Determine the API base URL
const apiBaseUrl = process.env.VUE_APP_API_URL || '/api';

// Log the API URL for debugging
console.log('API Base URL:', apiBaseUrl);

// Create an axios instance with default config
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for API calls
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Request:', config.method.toUpperCase(), config.url, config.data || config.params);
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle errors globally (like redirecting to login if unauthorized)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Log API errors
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    
    return Promise.reject(error);
  }
);

export default api; 