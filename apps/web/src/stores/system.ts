import { create } from 'zustand';
import request from '../utils/request';

interface SystemState {
  systemName: string;
  configs: Record<string, string>;
  
  // Actions
  fetchSystemName: () => Promise<void>;
  fetchConfigs: () => Promise<void>;
  updateConfigs: (configs: Record<string, string>) => Promise<void>;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  systemName: '智慧办公系统',
  configs: {},

  fetchSystemName: async () => {
    try {
      const data = await request.get('/system/name');
      set({ systemName: data.name });
      document.title = data.name;
    } catch (error) {
      console.error('获取系统名称失败:', error);
    }
  },

  fetchConfigs: async () => {
    try {
      const configs = await request.get('/system/configs');
      set({ configs });
      if (configs.system_name) {
        set({ systemName: configs.system_name });
        document.title = configs.system_name;
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
    }
  },

  updateConfigs: async (configs: Record<string, string>) => {
    await request.put('/system/configs', configs);
    set({ configs: { ...get().configs, ...configs } });
    if (configs.system_name) {
      set({ systemName: configs.system_name });
      document.title = configs.system_name;
    }
  },
}));
