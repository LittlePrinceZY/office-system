import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../../stores/auth';
import request from '../../../../utils/request';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface Contract {
  id: string;
  code: string;
  name: string;
  amount: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
  customer: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  totalAmount: number;
}

const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, []);

  const fetchContracts = async (params?: any) => {
    setLoading(true);
    try {
      const queryParams = {
        ...searchParams,
        ...params,
        startDate: searchParams.dateRange?.[0]?.toISOString(),
        endDate: searchParams.dateRange?.[1]?.toISOString(),
      };
      const data = await request.get('/crm/contracts', { params: queryParams });
      setContracts(data.list);
    } catch (error) {
      console.error('获取合同列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await request.get('/crm/statistics');
      setStats({
        totalContracts: data.totalContracts,
        activeContracts: data.activeContracts,
        expiredContracts: data.totalContracts - data.activeContracts,
        totalAmount: data.totalContractAmount,
      });
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Tag color="default">草稿</Tag>;
      case 'PENDING':
        return <Tag color="orange">待审批</Tag>;
      case 'ACTIVE':
        return <Tag color="success">生效中</Tag>;
      case 'EXPIRED':
        return <Tag color="warning">已过期</Tag>;
      case 'TERMINATED':
        return <Tag color="error">已终止</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleSearch = () => {
    fetchContracts();
  };

  const handleReset = () => {
    setSearchParams({
      keyword: '',
      status: '',
      dateRange: null,
    });
    fetchContracts({
      keyword: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleCreate = async (values: any) => {
    try {
      await request.post('/crm/contracts', {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      });
      message.success('合同创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchContracts();
      fetchStats();
    } catch (error: any) {
      message.error(error.message || '创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个合同吗？',
      onOk: async () => {
        try {
          await request.delete(`/crm/contracts/${id}`);
          message.success('删除成功');
          fetchContracts();
          fetchStats();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '合同名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: { name: string }) => customer?.name || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Contract) => (
        <Text strong>¥{amount.toLocaleString()}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '起止时间',
      key: 'dateRange',
      render: (record: Contract) => (
        <Text>
          {dayjs(record.startDate).format('YYYY-MM-DD')} ~{' '}
          {dayjs(record.endDate).format('YYYY-MM-DD')}
        </Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Contract) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/office/crm/contracts/${record.id}`)}
          >
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          合同管理
        </Title>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已过期"
                value={stats.expiredContracts}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="合同总额"
                value={stats.totalAmount}
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              placeholder="搜索合同名称/编号"
              value={searchParams.keyword}
              onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="合同状态"
              allowClear
              value={searchParams.status || undefined}
              onChange={value => setSearchParams({ ...searchParams, status: value })}
            >
              <Option value="DRAFT">草稿</Option>
              <Option value="PENDING">待审批</Option>
              <Option value="ACTIVE">生效中</Option>
              <Option value="EXPIRED">已过期</Option>
              <Option value="TERMINATED">已终止</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={searchParams.dateRange}
              onChange={dates => setSearchParams({ ...searchParams, dateRange: dates as any })}
            />
          </Col>
          <Col xs={24} sm={2}>
            <Button
              type="primary"
              onClick={handleSearch}
              icon={<SearchOutlined />}
              style={{ width: '100%' }}
            >
              搜索
            </Button>
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col>
            <Button onClick={handleReset}>重置</Button>
          </Col>
        </Row>
      </Card>

      {/* 操作按钮和表格 */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新增合同
          </Button>
          <Space>
            <Button icon={<FileTextOutlined />}>导出</Button>
            <Button icon={<DollarOutlined />}>生成付款计划</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: contracts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增合同模态框 */}
      <Modal
        title="新增合同"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="合同编号"
                rules={[{ required: true, message: '请输入合同编号' }]}
              >
                <Input placeholder="请输入合同编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="合同名称"
                rules={[{ required: true, message: '请输入合同名称' }]}
              >
                <Input placeholder="请输入合同名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="关联客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户" showSearch>
                  {/* 这里需要从API获取客户列表 */}
                  <Option value="test1">测试客户1</Option>
                  <Option value="test2">测试客户2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="合同金额"
                rules={[{ required: true, message: '请输入合同金额' }]}
              >
                <Input
                  type="number"
                  placeholder="请输入合同金额"
                  prefix="¥"
                  suffix="元"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束日期"
                rules={[{ required: true, message: '请选择结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="currency" label="货币" initialValue="CNY">
                <Select>
                  <Option value="CNY">人民币 (¥)</Option>
                  <Option value="USD">美元 ($)</Option>
                  <Option value="EUR">欧元 (€)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="合同状态" initialValue="DRAFT">
                <Select>
                  <Option value="DRAFT">草稿</Option>
                  <Option value="PENDING">待审批</Option>
                  <Option value="ACTIVE">生效中</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="content" label="合同内容">
            <Input.TextArea rows={4} placeholder="请输入合同主要内容" />
          </Form.Item>

          <Form.Item name="attachments" label="附件">
            <Input.TextArea rows={2} placeholder="请输入附件信息，多个附件用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractList;