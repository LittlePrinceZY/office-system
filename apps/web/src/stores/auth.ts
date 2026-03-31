import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import request from '../utils/request';

interface User {
  id: string;
  username: string;
  realName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  department?: {
    id: string;
    name: string;
  };
  position?: string;
  isAdmin: boolean;
  roles: any[];
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchUserInfo: () => Promise<void>;
  initialize: () => void;
  updateUser: (user: Partial<User>) => void;
}

interface RegisterData {
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
  departmentId?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await request.post('/auth/login', { username, password });
          const { user, accessToken, refreshToken } = data;
          
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const result = await request.post('/auth/register', data);
          const { user, accessToken, refreshToken } = result;
          
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      fetchUserInfo: async () => {
        try {
          const user = await request.get('/auth/me');
          set({ user, isAuthenticated: true });
        } catch (error) {
          get().logout();
        }
      },

      initialize: () => {
        const token = localStorage.getItem('token');
        if (token) {
          set({ token, isAuthenticated: true });
          get().fetchUserInfo();
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
