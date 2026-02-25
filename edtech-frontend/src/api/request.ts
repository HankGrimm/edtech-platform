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
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
