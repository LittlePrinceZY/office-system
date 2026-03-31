import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Avatar,
  Tag,
  Typography,
  Button,
  Empty,
  Skeleton,
} from 'antd';
import {
  FileTextOutlined,
  BellOutlined,
  TeamOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/auth';
import request from '../../../utils/request';
import dayjs from 'dayjs';
import './style.css';

const { Title, Text } = Typography;

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todos, setTodos] = useState<{ [key: string]: TodoItem[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, todosRes] = await Promise.all([
        request.get('/system/dashboard'),
        request.get('/system/todos'),
      ]);

      setStats(statsRes);
      setTodos(todosRes);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '待审批',
      value: stats?.pendingApprovals || 0,
      icon: <FileTextOutlined />,
      color: '#faad14',
      link: '/office/approvals/pending',
    },
    {
      title: '待审批报销',
      value: stats?.pendingReimbursements || 0,
      icon: <DollarOutlined />,
      color: '#f5222d',
      link: '/office/finance',
      adminOnly: true,
    },
    {
      title: '未读公告',
      value: stats?.unreadAnnouncements || 0,
      icon: <BellOutlined />,
      color: '#1890ff',
      link: '/office/announcements',
    },
    {
      title: '我的客户',
      value: stats?.myCustomers || 0,
      icon: <TeamOutlined />,
      color: '#52c41a',
      link: '/office/crm',
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

  const getTodoTag = (type: string) => {
    switch (type) {
      case 'approval':
        return <Tag color="warning">审批</Tag>;
      case 'announcement':
        return <Tag color="processing">公告</Tag>;
      case 'reimbursement':
        return <Tag color="success">报销</Tag>;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-page">
      {/* 欢迎区域 */}
      <div className="welcome-section">
        <div className="welcome-info">
          <Title level={3} className="welcome-title">
            欢迎回来，{user?.realName}！
          </Title>
          <Text type="secondary">
            今天是 {dayjs().format('YYYY年MM月DD日 dddd')}，祝您工作愉快！
          </Text>
        </div>
        <div className="welcome-actions">
          <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate('/office/chat')}>
            开始工作
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="stats-section">
        {statCards
          .filter((card) => !card.adminOnly || user?.isAdmin)
          .map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.title}>
              <Card
                className="stat-card"
                loading={loading}
                onClick={() => navigate(card.link)}
                hoverable
              >
                <div className="stat-card-content">
                  <div className="stat-icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="stat-info">
                    <Text type="secondary" className="stat-title">
                      {card.title}
                    </Text>
                    <Statistic value={card.value} valueStyle={{ color: card.color }} />
                  </div>
                </div>
              </Card>
            </Col>
          ))}
      </Row>

      {/* 待办事项 */}
      <Row gutter={[24, 24]} className="content-section">
        <Col xs={24} lg={12}>
          <Card
            title="待审批"
            className="todo-card"
            extra={
              <Button type="link" onClick={() => navigate('/office/approvals/pending')}>
                查看全部
              </Button>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : todos.approvals?.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={todos.approvals.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    className="todo-list-item"
                    onClick={() => navigate(item.link)}
                  >
                    <List.Item.Meta
                      avatar={getTodoIcon(item.type)}
                      title={
                        <Space>
                          {item.title}
                          {getTodoTag(item.type)}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" ellipsis>
                            {item.description}
                          </Text>
                          <Text type="secondary" className="todo-time">
                            <ClockCircleOutlined /> {dayjs(item.createdAt).format('MM-DD HH:mm')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无待审批事项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="未读公告"
            className="todo-card"
            extra={
              <Button type="link" onClick={() => navigate('/office/announcements')}>
                查看全部
              </Button>
            }
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : todos.announcements?.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={todos.announcements.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    className="todo-list-item"
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
                            <ClockCircleOutlined /> {dayjs(item.createdAt).format('MM-DD HH:mm')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无未读公告" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card title="快捷操作" className="quick-actions-card">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              type="dashed"
              block
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => navigate('/office/approvals')}
            >
              发起审批
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              type="dashed"
              block
              size="large"
              icon={<DollarOutlined />}
              onClick={() => navigate('/office/finance')}
            >
              报销申请
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              type="dashed"
              block
              size="large"
              icon={<TeamOutlined />}
              onClick={() => navigate('/office/crm')}
            >
              新增客户
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              type="dashed"
              block
              size="large"
              icon={<MessageOutlined />}
              onClick={() => navigate('/office/chat')}
            >
              发起聊天
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
