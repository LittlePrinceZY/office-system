import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  Space,
  Typography,
  Button,
  theme,
} from 'antd';
import {
  HomeOutlined,
  ContactsOutlined,
  MessageOutlined,
  NotificationOutlined,
  FileTextOutlined,
  DollarOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/auth';
import { useSystemStore } from '../../../stores/system';
import ThemeToggle from '../../../components/ThemeToggle';
import './style.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const OfficeLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { systemName } = useSystemStore();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      // TODO: 个人中心
    } else if (key === 'settings') {
      // TODO: 账号设置
    }
  };

  const menuItems = [
    {
      key: '/office',
      icon: <HomeOutlined />,
      label: '工作台',
    },
    {
      key: '/office/contacts',
      icon: <ContactsOutlined />,
      label: '通讯录',
    },
    {
      key: '/office/chat',
      icon: <MessageOutlined />,
      label: '即时通讯',
    },
    {
      key: '/office/announcements',
      icon: <NotificationOutlined />,
      label: '公示公告',
    },
    {
      key: '/office/approvals',
      icon: <FileTextOutlined />,
      label: '审批管理',
    },
    {
      key: '/office/finance',
      icon: <DollarOutlined />,
      label: '财务报销',
    },
    {
      key: '/office/crm',
      icon: <CustomerServiceOutlined />,
      label: '客户管理',
    },
  ];

  // 系统管理菜单（仅管理员可见）
  const systemMenuItems = user?.isAdmin
    ? [
        {
          key: 'system',
          icon: <SettingOutlined />,
          label: '系统管理',
          children: [
            {
              key: '/office/system/users',
              label: '用户管理',
            },
            {
              key: '/office/system/roles',
              label: '角色管理',
            },
            {
              key: '/office/system/departments',
              label: '部门管理',
            },
            {
              key: '/office/system/config',
              label: '系统配置',
            },
          ],
        },
      ]
    : [];

  const allMenuItems = [...menuItems, ...systemMenuItems];

  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/office') return ['/office'];
    
    // 处理子路由
    for (const item of allMenuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (path.startsWith(child.key)) {
            return [child.key];
          }
        }
      }
      if (path.startsWith(item.key)) {
        return [item.key];
      }
    }
    return ['/office'];
  };

  return (
    <Layout className="office-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="office-sider"
        style={{ background: colorBgContainer }}
      >
        <div className="sider-header">
          <div className="logo">
            {!collapsed && <span className="logo-text">{systemName}</span>}
            {collapsed && <span className="logo-icon">🏢</span>}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={allMenuItems}
          onClick={({ key }) => navigate(key)}
          className="office-menu"
        />
      </Sider>
      
      <Layout>
        <Header className="office-header" style={{ background: colorBgContainer }}>
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/portal')}
              className="back-btn"
            >
              返回门户
            </Button>
          </div>
          
          <div className="header-right">
            <Space size={24}>
              <ThemeToggle size="small" />
              <Badge count={0} size="small">
                <Button type="text" icon={<NotificationOutlined />} />
              </Badge>
              
              <Dropdown
                menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                placement="bottomRight"
              >
                <Space className="user-dropdown" style={{ cursor: 'pointer' }}>
                  <Avatar src={user?.avatar} icon={<UserOutlined />} />
                  {!collapsed && (
                    <div className="user-info">
                      <Text strong>{user?.realName}</Text>
                      <Text type="secondary" className="user-dept">
                        {user?.department?.name}
                      </Text>
                    </div>
                  )}
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="office-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default OfficeLayout;
