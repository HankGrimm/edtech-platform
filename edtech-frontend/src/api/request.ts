import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

// --- Configuration ---
// Set this to 'false' to use real backend
export const ENABLE_MOCK = false; 

const BASE_URL = 'http://localhost:8080/api';

// --- Axios Instance ---
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// --- Request Interceptor ---
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // You can handle global error codes here (e.g. 401 logout)
    return response;
  },
  (error) => {
    // If Mock is enabled, we might want to suppress network errors and return mock data in Service layer
    // But typically axios throws error first. 
    // We will handle "Mock Fallback" in the service layer specifically.
    if (error.response && error.response.status === 401) {
      // Redirect to login or clear token
      console.warn('Unauthorized, please login.');
    }
    return Promise.reject(error);
  }
);

export default request;
