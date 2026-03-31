import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  // 检查本地存储或系统偏好
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  // 检查系统偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          
          // 应用到HTML元素
          const html = document.documentElement;
          if (newTheme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
          } else {
            html.classList.add('light');
            html.classList.remove('dark');
          }
          
          return { theme: newTheme };
        });
      },
      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        
        // 应用到HTML元素
        const html = document.documentElement;
        if (theme === 'dark') {
          html.classList.add('dark');
          html.classList.remove('light');
        } else {
          html.classList.add('light');
          html.classList.remove('dark');
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// 初始化主题
const initializeTheme = () => {
  const themeStore = useThemeStore.getState();
  themeStore.setTheme(themeStore.theme);
};

export default initializeTheme;