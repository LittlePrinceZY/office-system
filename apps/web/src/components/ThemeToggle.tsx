import React from 'react';
import { Button, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useThemeStore } from '../stores/theme';

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'middle' }) => {
  const { theme, toggleTheme } = useThemeStore();

  const buttonSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'middle';

  return (
    <Tooltip title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
      <Button
        type="text"
        icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
        size={buttonSize}
        style={{
          fontSize: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px',
        }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;