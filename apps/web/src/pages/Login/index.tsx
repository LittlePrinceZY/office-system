import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/auth';
import { useSystemStore } from '../../stores/system';
import './style.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  const { systemName } = useSystemStore();
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/portal');
    } catch (error) {
      // 错误已在request中处理
    }
  };

  const handleRegister = async (values: any) => {
    try {
      await register(values);
      message.success('注册成功');
      navigate('/portal');
    } catch (error) {
      // 错误已在request中处理
    }
  };

  const items = [
    {
      key: 'login',
      label: '账号登录',
      children: (
        <Form onFinish={handleLogin} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册账号',
      children: (
        <Form onFinish={handleRegister} size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="realName"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="真实姓名"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size="large"
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="login-container">
        <div className="login-left">
          <div className="login-brand">
            <h1>{systemName}</h1>
            <p>高效协同 · 智能办公 · 一站式企业管理平台</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <div className="feature-text">
                <h3>智能审批</h3>
                <p>自定义审批流程，提升办公效率</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <div className="feature-text">
                <h3>即时通讯</h3>
                <p>企业内部沟通，消息实时同步</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <h3>数据报表</h3>
                <p>多维度数据分析，辅助决策</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="login-right">
          <Card className="login-card">
            <div className="login-header">
              <h2>欢迎登录</h2>
              <p>请使用您的账号密码登录系统</p>
            </div>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={items}
              centered
            />
          </Card>
        </div>
      </div>
      
      <div className="login-footer">
        <p>© 2024 {systemName} · 让办公更高效</p>
      </div>
    </div>
  );
};

export default LoginPage;
