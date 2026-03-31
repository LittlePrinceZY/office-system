import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Avatar,
  Descriptions,
  Tabs,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Badge,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../../stores/auth';
import request from '../../../../utils/request';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Customer {
  id: string;
  name: string;
  type: string;
  industry?: string;
  scale?: string;
  website?: string;
  address?: string;
  description?: string;
  status: string;
  owner: {
    id: string;
    realName: string;
    avatar?: string;
  };
  contacts: Contact[];
  contracts: Contract[];
  followUps: FollowUp[];
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  isPrimary: boolean;
}

interface Contract {
  id: string;
  code: string;
  name: string;
  amount: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface FollowUp {
  id: string;
  content: string;
  type: string;
  nextPlan?: string;
  nextDate?: string;
  creator: {
    id: string;
    realName: string;
    avatar?: string;
  };
  createdAt: string;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [contactForm] = Form.useForm();
  const [followUpForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchCustomerDetail();
    }
  }, [id]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const data = await request.get(`/crm/customers/${id}`);
      setCustomer(data);
    } catch (error) {
      message.error('获取客户详情失败');
      navigate('/office/crm');
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

  const getContractStatusTag = (status: string) => {
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

  const getFollowUpTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      PHONE: '电话沟通',
      EMAIL: '邮件沟通',
      VISIT: '上门拜访',
      MEETING: '会议',
      OTHER: '其他',
    };
    return types[type] || type;
  };

  const handleAddContact = async (values: any) => {
    try {
      await request.post('/crm/contacts', {
        ...values,
        customerId: id,
      });
      message.success('联系人添加成功');
      setContactModalVisible(false);
      contactForm.resetFields();
      fetchCustomerDetail();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleAddFollowUp = async (values: any) => {
    try {
      await request.post('/crm/follow-ups', {
        ...values,
        customerId: id,
      });
      message.success('跟进记录添加成功');
      setFollowUpModalVisible(false);
      followUpForm.resetFields();
      fetchCustomerDetail();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个联系人吗？',
      onOk: async () => {
        try {
          await request.delete(`/crm/contacts/${contactId}`);
          message.success('删除成功');
          fetchCustomerDetail();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const contactColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Contact) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{text}</Text>
          {record.isPrimary && <Tag color="blue">首要联系人</Tag>}
        </Space>
      ),
    },
    {
      title: '职位',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => text || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) =>
        text ? (
          <Space>
            <PhoneOutlined />
            <a href={`tel:${text}`}>{text}</a>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) =>
        text ? (
          <Space>
            <MailOutlined />
            <a href={`mailto:${text}`}>{text}</a>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '微信',
      dataIndex: 'wechat',
      key: 'wechat',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Contact) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteContact(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const contractColumns = [
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
      render: getContractStatusTag,
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
      title: '操作',
      key: 'action',
      render: (record: Contract) => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '客户概览',
      children: customer && (
        <>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="客户状态">
                {getStatusTag(customer.status)}
              </Descriptions.Item>
              <Descriptions.Item label="客户类型">
                {getTypeLabel(customer.type)}
              </Descriptions.Item>
              <Descriptions.Item label="所属行业">
                {customer.industry || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="企业规模">
                {customer.scale || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="网站">
                {customer.website ? (
                  <a href={customer.website} target="_blank" rel="noopener noreferrer">
                    {customer.website}
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="地址">
                {customer.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="负责人" span={2}>
                <Space>
                  <Avatar size="small" src={customer.owner.avatar} icon={<UserOutlined />} />
                  <Text>{customer.owner.realName}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(customer.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(customer.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {customer.description && (
            <Card title="备注说明" style={{ marginBottom: 16 }}>
              <Paragraph>{customer.description}</Paragraph>
            </Card>
          )}
        </>
      ),
    },
    {
      key: 'contacts',
      label: (
        <span>
          联系人 <Badge count={customer?.contacts.length || 0} />
        </span>
      ),
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setContactModalVisible(true)}
            >
              新增联系人
            </Button>
          </div>
          <Table
            columns={contactColumns}
            dataSource={customer?.contacts || []}
            rowKey="id"
            pagination={false}
          />
        </>
      ),
    },
    {
      key: 'follow-ups',
      label: '跟进记录',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFollowUpModalVisible(true)}
            >
              添加跟进记录
            </Button>
          </div>
          <Timeline>
            {customer?.followUps.map(followUp => (
              <Timeline.Item
                key={followUp.id}
                dot={<MessageOutlined style={{ fontSize: '16px' }} />}
              >
                <Card size="small" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>{followUp.creator.realName}</Text>
                      <Tag style={{ marginLeft: 8 }}>{getFollowUpTypeLabel(followUp.type)}</Tag>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {dayjs(followUp.createdAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </div>
                  </div>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    {followUp.content}
                  </Paragraph>
                  {followUp.nextPlan && (
                    <>
                      <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                        下一步计划:
                      </Text>
                      <Text style={{ marginLeft: 8 }}>{followUp.nextPlan}</Text>
                      {followUp.nextDate && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({dayjs(followUp.nextDate).format('YYYY-MM-DD')})
                        </Text>
                      )}
                    </>
                  )}
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      ),
    },
    {
      key: 'contracts',
      label: (
        <span>
          合同 <Badge count={customer?.contracts.length || 0} />
        </span>
      ),
      children: (
        <Table
          columns={contractColumns}
          dataSource={customer?.contracts || []}
          rowKey="id"
          pagination={false}
        />
      ),
    },
  ];

  if (loading) {
    return <Card loading={loading} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/office/crm')}
          style={{ marginRight: 16 }}
        >
          返回
        </Button>
        <Title level={4} style={{ margin: 0, display: 'inline-block' }}>
          {customer?.name}
        </Title>
      </div>

      <Card>
        <Tabs items={tabItems} defaultActiveKey="overview" />
      </Card>

      {/* 新增联系人模态框 */}
      <Modal
        title="新增联系人"
        open={contactModalVisible}
        onCancel={() => setContactModalVisible(false)}
        onOk={() => contactForm.submit()}
        width={600}
      >
        <Form form={contactForm} layout="vertical" onFinish={handleAddContact}>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="title" label="职位">
            <Input placeholder="请输入职位" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          <Form.Item name="wechat" label="微信">
            <Input placeholder="请输入微信号" />
          </Form.Item>
          <Form.Item name="isPrimary" label="" valuePropName="checked">
            <Select
              options={[
                { label: '普通联系人', value: false },
                { label: '首要联系人', value: true },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加跟进记录模态框 */}
      <Modal
        title="添加跟进记录"
        open={followUpModalVisible}
        onCancel={() => setFollowUpModalVisible(false)}
        onOk={() => followUpForm.submit()}
        width={600}
      >
        <Form form={followUpForm} layout="vertical" onFinish={handleAddFollowUp}>
          <Form.Item
            name="type"
            label="跟进方式"
            rules={[{ required: true, message: '请选择跟进方式' }]}
          >
            <Select
              options={[
                { label: '电话沟通', value: 'PHONE' },
                { label: '邮件沟通', value: 'EMAIL' },
                { label: '上门拜访', value: 'VISIT' },
                { label: '会议', value: 'MEETING' },
                { label: '其他', value: 'OTHER' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请详细描述跟进内容" />
          </Form.Item>
          <Form.Item name="nextPlan" label="下一步计划">
            <TextArea rows={2} placeholder="请输入下一步计划" />
          </Form.Item>
          <Form.Item name="nextDate" label="计划时间">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerDetail;