import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/auth';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code, message: msg, data } = response.data;
    
    if (code === 200) {
      return data;
    }
    
    // 业务错误
    message.error(msg || '操作失败');
    return Promise.reject(new Error(msg));
  },
  (error: AxiosError) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response as any;
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          useAuthStore.getState().logout();
          window.location.href = '/login';
          break;
        case 403:
          message.error('无权访问该资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data?.message || '网络错误');
      }
    } else {
      message.error('网络连接失败');
    }
    
    return Promise.reject(error);
  }
);

export default request;
