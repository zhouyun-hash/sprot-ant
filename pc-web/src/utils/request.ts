import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('pc_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('pc_token');
      localStorage.removeItem('pc_user');
      localStorage.removeItem('pc_permissions');
      if (location.pathname !== '/login') {
        location.href = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
      }
    } else {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        '请求失败，请稍后重试';
      ElMessage.error(Array.isArray(msg) ? msg.join('，') : String(msg));
    }
    return Promise.reject(error);
  },
);

export default request;
