import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Input,
  Select,
  Modal,
  Form,
  message,
  Avatar,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/auth';
import request from '../../../utils/request';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Customer {
  id: string;
  name: string;
  type: string;
  industry?: string;
  status: 'POTENTIAL' | 'FOLLOWING' | 'SIGNED' | 'LOST';
  owner: { realName: string };
  contactCount: number;
  contractCount: number;
  followUpCount: number;
  createdAt: string;
}

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (params?: any) => {
    setLoading(true);
    try {
      const queryParams = { ...searchParams, ...params };
      const data = await request.get('/crm/customers', { params: queryParams });
      setCustomers(data.list);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'POTENTIAL':
        return <Tag color="default">潜在客户</Tag>;
      case 'FOLLOWING':
        return <Tag color="processing">跟进中</Tag>;
      case 'SIGNED':
        return <Tag color="success">已签约</Tag>;
      case 'LOST':
        return <Tag color="error">已流失</Tag>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      ENTERPRISE: '企业',
      INDIVIDUAL: '个人',
      GOVERNMENT: '政府',
    };
    return types[type] || type;
  };

  const handleSearch = () => {
    fetchCustomers();
  };

  const handleReset = () => {
    setSearchParams({
      keyword: '',
      status: '',
    });
    fetchCustomers({
      keyword: '',
      status: '',
    });
  };

  const handleCreate = async (values: any) => {
    try {
      await request.post('/crm/customers', values);
      message.success('客户创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？',
      onOk: async () => {
        try {
          await request.delete(`/crm/customers/${id}`);
          message.success('删除成功');
          fetchCustomers();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customer) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text
            strong
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/office/crm/customers/${record.id}`)}
          >
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeLabel(type),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      render: (industry: string) => industry || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner: { realName: string }) => owner?.realName,
    },
    {
      title: '联系人',
      dataIndex: 'contactCount',
      key: 'contactCount',
      render: (count: number) => <Badge count={count} showZero color="#1890ff" />,
    },
    {
      title: '合同',
      dataIndex: 'contractCount',
      key: 'contractCount',
      render: (count: number) => <Badge count={count} showZero color="#52c41a" />,
    },
    {
      title: '跟进',
      dataIndex: 'followUpCount',
      key: 'followUpCount',
      render: (count: number) => <Badge count={count} showZero color="#faad14" />,
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
      render: (record: Customer) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/office/crm/customers/${record.id}`)}
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
    <>
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索客户名称/地址"
            value={searchParams.keyword}
            onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="客户状态"
            style={{ width: 150 }}
            allowClear
            value={searchParams.status || undefined}
            onChange={value => setSearchParams({ ...searchParams, status: value })}
          >
            <Option value="POTENTIAL">潜在客户</Option>
            <Option value="FOLLOWING">跟进中</Option>
            <Option value="SIGNED">已签约</Option>
            <Option value="LOST">已流失</Option>
          </Select>
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 操作按钮和表格 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{ marginRight: 8 }}
          >
            新增客户
          </Button>
          <Button icon={<SearchOutlined />} onClick={() => navigate('/office/crm/contracts')}>
            查看合同
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: customers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增客户模态框 */}
      <Modal
        title="新增客户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="客户类型"
            rules={[{ required: true, message: '请选择客户类型' }]}
          >
            <Select
              options={[
                { label: '企业', value: 'ENTERPRISE' },
                { label: '个人', value: 'INDIVIDUAL' },
                { label: '政府', value: 'GOVERNMENT' },
              ]}
            />
          </Form.Item>
          <Form.Item name="industry" label="所属行业">
            <Input placeholder="请输入所属行业" />
          </Form.Item>
          <Form.Item name="scale" label="企业规模">
            <Select
              options={[
                { label: '微型企业', value: 'MICRO' },
                { label: '小型企业', value: 'SMALL' },
                { label: '中型企业', value: 'MEDIUM' },
                { label: '大型企业', value: 'LARGE' },
              ]}
            />
          </Form.Item>
          <Form.Item name="website" label="网站">
            <Input placeholder="请输入网站地址" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CustomerList;