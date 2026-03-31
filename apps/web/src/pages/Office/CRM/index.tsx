import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Typography,
  Statistic,
  Row,
  Col,
  Space,
  Button,
  Badge,
} from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import request from '../../../utils/request';
import CustomerList from './CustomerList';
import './style.css';

const { Title } = Typography;

const CRMStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await request.get('/crm/statistics');
      setStats(data);
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  if (!stats) return null;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="客户总数"
            value={stats.totalCustomers}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="潜在客户"
            value={stats.potentialCustomers}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="已签约"
            value={stats.signedCustomers}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="跟进中"
            value={stats.followingCustomers || 0}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="合同总数"
            value={stats.totalContracts}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="生效合同"
            value={stats.activeContracts}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="合同总额"
            value={stats.totalContractAmount}
            prefix="¥"
            precision={2}
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="平均合同额"
            value={stats.totalContractAmount / (stats.totalContracts || 1)}
            prefix="¥"
            precision={2}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card title="快捷操作" style={{ marginBottom: 16 }}>
      <Space wrap>
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => navigate('/office/crm?tab=customers')}
        >
          新增客户
        </Button>
        <Button
          icon={<FileTextOutlined />}
          onClick={() => navigate('/office/crm/contracts')}
        >
          管理合同
        </Button>
        <Button
          icon={<DollarOutlined />}
          onClick={() => navigate('/office/crm?tab=statistics')}
        >
          查看报表
        </Button>
        <Button
          icon={<LineChartOutlined />}
          onClick={() => navigate('/office/crm?tab=statistics')}
        >
          销售分析
        </Button>
      </Space>
    </Card>
  );
};

const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // 模拟近期活动数据
      const mockActivities = [
        { id: 1, type: 'customer', action: '新增客户', content: 'ABC科技有限公司', time: '2024-05-20 14:30' },
        { id: 2, type: 'contract', action: '签署合同', content: 'ERP系统开发合同', time: '2024-05-19 10:15' },
        { id: 3, type: 'followup', action: '客户跟进', content: '与李经理电话沟通需求', time: '2024-05-18 16:45' },
        { id: 4, type: 'contract', action: '合同到期', content: '网站维护合同即将到期', time: '2024-05-17 09:20' },
        { id: 5, type: 'customer', action: '客户升级', content: 'XYZ公司状态转为已签约', time: '2024-05-16 11:30' },
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('获取活动记录失败:', error);
    }
  };

  return (
    <Card title="近期活动">
      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {activities.map(activity => (
          <div
            key={activity.id}
            style={{
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ marginRight: 8 }}>
                {activity.type === 'customer' && <UserOutlined style={{ color: '#1890ff' }} />}
                {activity.type === 'contract' && <FileTextOutlined style={{ color: '#52c41a' }} />}
                {activity.type === 'followup' && <TeamOutlined style={{ color: '#faad14' }} />}
              </span>
              <span style={{ fontWeight: 500 }}>{activity.action}:</span>
              <span style={{ marginLeft: 8 }}>{activity.content}</span>
            </div>
            <span style={{ color: '#999', fontSize: 12 }}>{activity.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const CRM: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabItems = [
    {
      key: 'dashboard',
      label: '仪表盘',
      children: (
        <>
          <QuickActions />
          <CRMStats />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <RecentActivities />
            </Col>
            <Col xs={24} lg={8}>
              <Card title="任务提醒">
                <div style={{ padding: 8 }}>
                  <p><Badge status="processing" /> 3个客户需要跟进</p>
                  <p><Badge status="warning" /> 2个合同即将到期</p>
                  <p><Badge status="success" /> 本月新增5个客户</p>
                  <p><Badge status="default" /> 待处理审批: 1个</p>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'customers',
      label: '客户管理',
      children: <CustomerList />,
    },
    {
      key: 'statistics',
      label: '数据分析',
      children: <CRMStats />,
    },
  ];

  return (
    <div className="crm-page">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          客户关系管理
        </Title>
        <Space style={{ float: 'right' }}>
          <Button onClick={() => navigate('/office/crm/contracts')}>合同管理</Button>
          <Button type="primary" onClick={() => navigate('/office/crm?tab=customers')}>
            新增客户
          </Button>
        </Space>
      </div>

      <Card className="crm-card">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
          defaultActiveKey="dashboard"
        />
      </Card>
    </div>
  );
};

export default CRM;
