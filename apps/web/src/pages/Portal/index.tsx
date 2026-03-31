import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Avatar,
  Badge,
  List,
  Typography,
  Button,
  Space,
  Statistic,
  Carousel,
  Tag,
} from 'antd';
import {
  MessageOutlined,
  BellOutlined,
  FileTextOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  ArrowRightOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/auth';
import { useSystemStore } from '../../stores/system';
import ThemeToggle from '../../components/ThemeToggle';
import request from '../../utils/request';
import dayjs from 'dayjs';
import './style.css';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
  pendingApprovals: number;
  pendingReimbursements: number;
  unreadAnnouncements: number;
  myCustomers: number;
  recentContractAmount: number;
}

interface TodoItem {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  link: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: { name: string };
  isTop: boolean;
  createdAt: string;
}

const PortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { systemName } = useSystemStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, todosRes, announcementsRes] = await Promise.all([
        request.get('/system/dashboard'),
        request.get('/system/todos'),
        request.get('/announcements?pageSize=5'),
      ]);

      setStats(statsRes);
      
      // 合并所有待办事项
      const allTodos = [
        ...(todosRes.approvals || []),
        ...(todosRes.announcements || []),
        ...(todosRes.reimbursements || []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTodos(allTodos.slice(0, 5));
      
      setAnnouncements(announcementsRes.list || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const quickLinks = [
    {
      title: '通讯录',
      icon: <TeamOutlined />,
      color: '#1890ff',
      path: '/office/contacts',
    },
    {
      title: '即时通讯',
      icon: <MessageOutlined />,
      color: '#52c41a',
      path: '/office/chat',
    },
    {
      title: '审批管理',
      icon: <FileTextOutlined />,
      color: '#faad14',
      path: '/office/approvals',
    },
    {
      title: '财务报销',
      icon: <DollarOutlined />,
      color: '#f5222d',
      path: '/office/finance',
    },
    {
      title: '客户管理',
      icon: <UserOutlined />,
      color: '#722ed1',
      path: '/office/crm',
    },
    {
      title: '系统设置',
      icon: <SettingOutlined />,
      color: '#13c2c2',
      path: '/office/system/config',
      adminOnly: true,
    },
  ];

  const getTodoIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <FileTextOutlined style={{ color: '#faad14' }} />;
      case 'announcement':
        return <BellOutlined style={{ color: '#1890ff' }} />;
      case 'reimbursement':
        return <DollarOutlined style={{ color: '#52c41a' }} />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  return (
    <Layout className="portal-layout">
      <Header className="portal-header">
        <div className="portal-header-left">
          <div className="portal-logo">
            <div className="logo-icon">🏢</div>
            <span className="logo-text">{systemName}</span>
          </div>
        </div>
        <div className="portal-header-right">
          <Space size={24}>
            <ThemeToggle size="middle" />
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/office')}
            >
              进入办公模式
            </Button>
            <div className="user-info">
              <Avatar src={user?.avatar} icon={<UserOutlined />} size="large" />
              <div className="user-meta">
                <Text strong>{user?.realName}</Text>
                <Text type="secondary" className="user-dept">
                  {user?.department?.name || '未分配部门'}
                </Text>
              </div>
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="logout-btn"
            >
              退出
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="portal-content">
        {/* 欢迎横幅 */}
        <div className="welcome-banner">
          <div className="welcome-content">
            <Title level={2} className="welcome-title">
              欢迎回来，{user?.realName}！
            </Title>
            <Text className="welcome-subtitle">
              今天是 {dayjs().format('YYYY年MM月DD日 dddd')}，祝您工作愉快！
            </Text>
          </div>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[24, 24]} className="stats-row">
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="待审批"
                value={stats?.pendingApprovals || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="未读公告"
                value={stats?.unreadAnnouncements || 0}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="我的客户"
                value={stats?.myCustomers || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" loading={loading}>
              <Statistic
                title="合同金额"
                value={stats?.recentContractAmount || 0}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#f5222d' }}
                formatter={(value) => `¥${value.toLocaleString()}`}
              />
            </Card>
          </Col>
        </Row>

        {/* 快捷入口和待办事项 */}
        <Row gutter={[24, 24]} className="content-row">
          <Col xs={24} lg={16}>
            <Card
              title="快捷入口"
              className="portal-card"
              extra={
                <Button type="link" onClick={() => navigate('/office')}>
                  查看全部
                </Button>
              }
            >
              <Row gutter={[16, 16]}>
                {quickLinks
                  .filter((link) => !link.adminOnly || user?.isAdmin)
                  .map((link) => (
                    <Col xs={12} sm={8} md={8} lg={8} key={link.title}>
                      <div
                        className="quick-link-item"
                        onClick={() => navigate(link.path)}
                      >
                        <div
                          className="quick-link-icon"
                          style={{ backgroundColor: `${link.color}15`, color: link.color }}
                        >
                          {link.icon}
                        </div>
                        <Text className="quick-link-title">{link.title}</Text>
                      </div>
                    </Col>
                  ))}
              </Row>
            </Card>

            {/* 公告轮播 */}
            <Card title="最新公告" className="portal-card announcement-card">
              {announcements.length > 0 ? (
                <Carousel autoplay className="announcement-carousel">
                  {announcements.slice(0, 3).map((item) => (
                    <div key={item.id} className="announcement-item">
                      <div className="announcement-header">
                        {item.isTop && <Tag color="red">置顶</Tag>}
                        <Tag color="blue">{item.category.name}</Tag>
                        <Text type="secondary">
                          {dayjs(item.createdAt).format('MM-DD')}
                        </Text>
                      </div>
                      <Title level={4} className="announcement-title">
                        {item.title}
                      </Title>
                      <Paragraph ellipsis={{ rows: 2 }} className="announcement-content">
                        {item.content.replace(/<[^>]+>/g, '')}
                      </Paragraph>
                      <Button
                        type="link"
                        onClick={() => navigate(`/office/announcements/${item.id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  ))}
                </Carousel>
              ) : (
                <div className="empty-state">暂无公告</div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title="待办事项"
              className="portal-card todo-card"
              extra={
                todos.length > 0 && (
                  <Badge count={todos.length} style={{ backgroundColor: '#f5222d' }} />
                )
              }
            >
              {todos.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={todos}
                  renderItem={(item) => (
                    <List.Item
                      className="todo-item"
                      onClick={() => navigate(item.link)}
                    >
                      <List.Item.Meta
                        avatar={getTodoIcon(item.type)}
                        title={item.title}
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary" ellipsis>
                              {item.description}
                            </Text>
                            <Text type="secondary" className="todo-time">
                              {dayjs(item.createdAt).format('MM-DD HH:mm')}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div className="empty-state">
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <Text type="secondary">暂无待办事项</Text>
                </div>
              )}
            </Card>

            {/* 日历卡片 */}
            <Card title="日程安排" className="portal-card calendar-card">
              <div className="calendar-placeholder">
                <CalendarOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <Text type="secondary">日程功能开发中...</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>

      <Footer className="portal-footer">
        <Text type="secondary">
          © 2024 {systemName} · 让办公更高效
        </Text>
      </Footer>
    </Layout>
  );
};

export default PortalPage;
