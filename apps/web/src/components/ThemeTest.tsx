import React from 'react';
import { Card, Typography, Space, Button, Divider } from 'antd';
import { useThemeStore } from '../stores/theme';
import ThemeToggle from './ThemeToggle';

const { Title, Text, Paragraph } = Typography;

const ThemeTest: React.FC = () => {
  const { theme } = useThemeStore();

  return (
    <Card title="主题切换测试" style={{ maxWidth: 600, margin: '20px auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>当前主题</Title>
          <Text strong>当前主题: {theme === 'light' ? '浅色模式' : '深色模式'}</Text>
          <Paragraph type="secondary">
            点击下面的按钮或使用主题切换组件来切换主题
          </Paragraph>
        </div>

        <Divider>主题切换组件</Divider>
        
        <div>
          <Title level={5}>不同尺寸的主题切换按钮</Title>
          <Space>
            <ThemeToggle size="small" />
            <ThemeToggle size="middle" />
            <ThemeToggle size="large" />
          </Space>
        </div>

        <Divider>主题应用测试</Divider>
        
        <div>
          <Title level={5}>测试不同主题下的元素</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card size="small" title="卡片标题">
              <p>这是一个测试卡片，用于展示主题效果</p>
              <Text type="secondary">次要文本颜色测试</Text>
            </Card>
            
            <div style={{ 
              padding: 16, 
              background: 'var(--ant-color-bg-container)', 
              borderRadius: 8,
              border: '1px solid var(--ant-color-border)'
            }}>
              <Text>容器背景和边框颜色测试</Text>
            </div>
          </Space>
        </div>

        <Divider>主题状态测试</Divider>
        
        <div>
          <Title level={5}>主题状态信息</Title>
          <Space direction="vertical">
            <Text>HTML元素类名: {document.documentElement.className}</Text>
            <Text>本地存储: {localStorage.getItem('theme-storage') || '无主题存储'}</Text>
            <Text>系统偏好: {window.matchMedia('(prefers-color-scheme: dark)').matches ? '深色模式' : '浅色模式'}</Text>
          </Space>
        </div>

        <div>
          <Button 
            type="primary" 
            onClick={() => {
              const html = document.documentElement;
              console.log('HTML类名:', html.className);
              console.log('当前主题:', theme);
              console.log('本地存储:', localStorage.getItem('theme-storage'));
            }}
          >
            在控制台打印主题信息
          </Button>
        </div>
      </Space>
    </Card>
  );
};

export default ThemeTest;