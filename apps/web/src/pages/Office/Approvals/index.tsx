import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  Typography,
  Badge,
  Empty,
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  message,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/auth';
import request from '../../../utils/request';
import dayjs from 'dayjs';
import './style.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Approval {
  id: string;
  title: string;
  template: { name: string; icon?: string };
  applicant: { realName: string; avatar?: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  completedAt?: string;
  tasks: any[];
}

const ApprovalList: React.FC<{ type: 'my' | 'pending' | 'processed' }> = ({ type }) => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchApprovals();
  }, [type, pagination.current]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'my' ? '/approvals/my' : type === 'pending' ? '/approvals/pending' : '/approvals/processed';
      const data = await request.get(endpoint, {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
        },
      });
      setApprovals(data.list);
      setPagination({ ...pagination, total: data.total });
    } catch (error) {
      console.error('获取审批列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag icon={<ClockCircleOutlined />} color="processing">审批中</Tag>;
      case 'APPROVED':
        return <Tag icon={<CheckCircleOutlined />} color="success">已通过</Tag>;
      case 'REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">已驳回</Tag>;
      case 'WITHDRAWN':
        return <Tag color="default">已撤回</Tag>;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: '审批标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Approval) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '审批类型',
      dataIndex: 'template',
      key: 'template',
      render: (template: { name: string }) => template?.name || '-',
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      render: (applicant: { realName: string }) => applicant?.realName || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Approval) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/office/approvals/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={approvals}
      rowKey="id"
      loading={loading}
      pagination={{
        ...pagination,
        onChange: (page) => setPagination({ ...pagination, current: page }),
      }}
    />
  );
};

const ApprovalTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await request.get('/approvals/templates');
      setTemplates(data.list);
    } catch (error) {
      console.error('获取模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (template: any) => {
    setSelectedTemplate(template);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      await request.post('/approvals', {
        templateId: selectedTemplate.id,
        title: `${selectedTemplate.name} - ${dayjs().format('YYYY-MM-DD')}`,
        formData: values,
      });
      message.success('审批申请提交成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('提交失败');
    }
  };

  return (
    <>
      <div className="templates-grid">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="template-card"
            hoverable
            onClick={() => handleCreate(template)}
          >
            <div className="template-icon">{template.icon || '📄'}</div>
            <Title level={5}>{template.name}</Title>
            <Text type="secondary">{template.description}</Text>
          </Card>
        ))}
      </div>

      <Modal
        title={`发起${selectedTemplate?.name || ''}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {selectedTemplate?.formSchema?.properties &&
            Object.entries(selectedTemplate.formSchema.properties).map(([key, field]: [string, any]) => (
              <Form.Item
                key={key}
                name={key}
                label={field.title}
                rules={selectedTemplate.formSchema.required?.includes(key) ? [{ required: true }] : []}
              >
                {field.enum ? (
                  <Select options={field.enum.map((v: string) => ({ label: v, value: v }))} />
                ) : field.format === 'date' ? (
                  <DatePicker style={{ width: '100%' }} />
                ) : field['x-component'] === 'textarea' ? (
                  <Input.TextArea rows={4} />
                ) : (
                  <Input />
                )}
              </Form.Item>
            ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Approvals: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      const data = await request.get('/approvals/stats/pending-count');
      setPendingCount(data.count);
    } catch (error) {
      console.error('获取待审批数量失败:', error);
    }
  };

  const items = [
    {
      key: 'templates',
      label: '发起审批',
      children: <ApprovalTemplates />,
    },
    {
      key: 'my',
      label: '我的申请',
      children: <ApprovalList type="my" />,
    },
    {
      key: 'pending',
      label: (
        <span>
          待我审批
          {pendingCount > 0 && <Badge count={pendingCount} style={{ marginLeft: 8 }} />}
        </span>
      ),
      children: <ApprovalList type="pending" />,
    },
    {
      key: 'processed',
      label: '已办事项',
      children: <ApprovalList type="processed" />,
    },
  ];

  return (
    <div className="approvals-page">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          审批管理
        </Title>
      </div>

      <Card className="approvals-card">
        <Tabs items={items} defaultActiveKey="templates" />
      </Card>
    </div>
  );
};

export default Approvals;
