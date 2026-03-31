import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import App from './App';
import { useThemeStore } from './stores/theme';
import './index.css';

dayjs.locale('zh-cn');

// 初始化主题
const initializeTheme = () => {
  const themeStore = useThemeStore.getState();
  themeStore.setTheme(themeStore.theme);
};

initializeTheme();

// 主题配置组件
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeStore();
  
  const antdThemeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
  };
  
  return (
    <ConfigProvider locale={zhCN} theme={antdThemeConfig}>
      {children}
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
