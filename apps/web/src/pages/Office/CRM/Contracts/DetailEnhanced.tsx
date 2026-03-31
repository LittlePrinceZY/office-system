import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Descriptions,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Statistic,
  Row,
  Col,
  Steps,
  Avatar,
  Alert,
  Popconfirm,
  Tabs,
  Table,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  RollbackOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import request from '../../../../utils/request';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface Contract {
  id: string;
  code: string;
  name: string;
  amount: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
  content?: string;
  attachments?: string[];
  customer: {
    id: string;
    name: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate?: string;
  description?: string;
}

interface ApprovalTask {
  id: string;
  name: string;
  status: string;
  result?: string;
  comment?: string;
  assignee?: {
    id: string;
    realName: string;
    avatar?: string;
  };
  assignedAt?: string;
  completedAt?: string;
}

interface ApprovalInfo {
  instanceId: string;
  status: string;
  tasks: ApprovalTask[];
  createdAt: string;
  completedAt?: string;
}

const ContractDetailEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchContractDetail();
      fetchPaymentRecords();
      fetchApprovalInfo();
    }
  }, [id]);

  const fetchContractDetail = async () => {
    setLoading(true);
    try {
      const data = await request.get(`/crm/contracts/${id}`);
      setContract(data);
      form.setFieldsValue({
        ...data,
        startDate: dayjs(data.startDate),
        endDate: dayjs(data.endDate),
      });
    } catch (error) {
      message.error('获取合同详情失败');
      navigate('/office/crm/contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentRecords = async () => {
    try {
      // 模拟付款记录数据
      const mockPayments: PaymentRecord[] = [
        {
          id: '1',
          amount: 50000,
          dueDate: '2024-06-01',
          status: 'PAID',
          paidDate: '2024-05-28',
          description: '第一期付款',
        },
        {
          id: '2',
          amount: 75000,
          dueDate: '2024-09-01',
          status: 'PENDING',
          description: '第二期付款',
        },
        {
          id: '3',
          amount: 75000,
          dueDate: '2024-12-01',
          status: 'PENDING',
          description: '第三期付款',
        },
      ];
      setPayments(mockPayments);
    } catch (error) {
      console.error('获取付款记录失败:', error);
    }
  };

  const fetchApprovalInfo = async () => {
    try {
      const data = await request.get(`/crm-approval/contracts/${id}/approval`);
      setApprovalInfo(data);
    } catch (error) {
      // 如果没有审批流程，忽略错误
      setApprovalInfo(null);
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
      case 'REJECTED':
        return <Tag color="red">已驳回</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getPaymentStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="orange">待支付</Tag>;
      case 'PAID':
        return <Tag color="success">已支付</Tag>;
      case 'OVERDUE':
        return <Tag color="error">已逾期</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      };
      await request.put(`/crm/contracts/${id}`, data);
      message.success('合同更新成功');
      setEditModalVisible(false);
      fetchContractDetail();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个合同吗？',
      onOk: async () => {
        try {
          await request.delete(`/crm/contracts/${id}`);
          message.success('删除成功');
          navigate('/office/crm/contracts');
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const handleStartApproval = async () => {
    try {
      await request.post(`/crm-approval/contracts/${id}/approval`, {
        contractName: contract?.name,
        amount: contract?.amount,
      });
      message.success('审批流程已启动');
      fetchApprovalInfo();
      fetchContractDetail();
    } catch (error: any) {
      message.error(error.message || '启动审批失败');
    }
  };

  const handleCancelApproval = async () => {
    try {
      await request.post(`/crm-approval/contracts/${id}/approval/cancel`);
      message.success('审批流程已取消');
      fetchApprovalInfo();
      fetchContractDetail();
    } catch (error: any) {
      message.error(error.message || '取消审批失败');
    }
  };

  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  const handleShare = () => {
    message.info('分享功能开发中...');
  };

  const calculateRemainingDays = () => {
    if (!contract) return 0;
    const endDate = dayjs(contract.endDate);
    const today = dayjs();
    return endDate.diff(today, 'day');
  };

  const calculateProgress = () => {
    if (!contract) return 0;
    const startDate = dayjs(contract.startDate);
    const endDate = dayjs(contract.endDate);
    const today = dayjs();
    const totalDays = endDate.diff(startDate, 'day');
    const passedDays = today.diff(startDate, 'day');
    return Math.min(Math.max((passedDays / totalDays) * 100, 0), 100);
  };

  const totalPaidAmount = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPendingAmount = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const renderApprovalSteps = () => {
    if (!approvalInfo?.tasks) return null;

    const steps = approvalInfo.tasks.map((task, index) => ({
      title: task.name,
      description: (
        <div>
          <div>{task.assignee?.realName || '待分配'}</div>
          {task.completedAt && (
            <div style={{ fontSize: 12, color: '#666' }}>
              {dayjs(task.completedAt).format('YYYY-MM-DD HH:mm')}
            </div>
          )}
        </div>
      ),
      icon: getApprovalStepIcon(task),
    }));

    return (
      <Card title="审批流程" style={{ marginBottom: 16 }}>
        <Steps current={getCurrentApprovalStep()} items={steps} />
        {approvalInfo.status === 'REJECTED' && (
          <Alert
            message="审批被驳回"
            description={getRejectionReason()}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
        {approvalInfo.status === 'APPROVED' && (
          <Alert
            message="审批已通过"
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    );
  };

  const getApprovalStepIcon = (task: ApprovalTask) => {
    switch (task.status) {
      case 'COMPLETED':
        return task.result === 'APPROVED' ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#f5222d' }} />
        );
      case 'IN_PROGRESS':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getCurrentApprovalStep = () => {
    if (!approvalInfo?.tasks) return 0;
    
    const completedTasks = approvalInfo.tasks.filter(
      task => task.status === 'COMPLETED'
    ).length;
    
    return completedTasks;
  };

  const getRejectionReason = () => {
    if (!approvalInfo?.tasks) return '';
    
    const rejectedTask = approvalInfo.tasks.find(
      task => task.result === 'REJECTED'
    );
    
    return rejectedTask?.comment || '未提供原因';
  };

  const renderApprovalActions = () => {
    if (!contract) return null;

    if (contract.status === 'DRAFT' && !approvalInfo) {
      return (
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleStartApproval}
          style={{ marginRight: 8 }}
        >
          发起审批
        </Button>
      );
    }

    if (contract.status === 'PENDING' && approvalInfo?.status === 'PENDING') {
      return (
        <Popconfirm
          title="确定要取消审批流程吗？"
          onConfirm={handleCancelApproval}
          okText="确定"
          cancelText="取消"
        >
          <Button icon={<RollbackOutlined />} style={{ marginRight: 8 }}>
            取消审批
          </Button>
        </Popconfirm>
      );
    }

    return null;
  };

  if (loading) {
    return <Card loading={loading} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/office/crm/contracts')}
          style={{ marginRight: 16 }}
        >
          返回
        </Button>
        <Title level={4} style={{ margin: 0, display: 'inline-block' }}>
          {contract?.name}
          <span style={{ marginLeft: 12 }}>{getStatusTag(contract?.status || '')}</span>
        </Title>
        <Space style={{ float: 'right' }}>
          {renderApprovalActions()}
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={handleShare}>
            分享
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setEditModalVisible(true)}
          >
            编辑
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="概览" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              {renderApprovalSteps()}
              
              <Card title="合同信息" style={{ marginBottom: 16 }}>
                <Descriptions column={2}>
                  <Descriptions.Item label="合同编号">
                    <Text strong>{contract?.code}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="合同状态">
                    {getStatusTag(contract?.status || '')}
                  </Descriptions.Item>
                  <Descriptions.Item label="关联客户">
                    {contract?.customer.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="客户地址">
                    {contract?.customer.address || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="合同金额">
                    <Text strong style={{ color: '#1890ff' }}>
                      ¥{contract?.amount?.toLocaleString()}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="货币">
                    {contract?.currency === 'CNY' ? '人民币' : contract?.currency}
                  </Descriptions.Item>
                  <Descriptions.Item label="合同期限">
                    {dayjs(contract?.startDate).format('YYYY-MM-DD')} ~{' '}
                    {dayjs(contract?.endDate).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="剩余天数">
                    <Text type={calculateRemainingDays() < 30 ? 'danger' : 'secondary'}>
                      {calculateRemainingDays()} 天
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {dayjs(contract?.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {dayjs(contract?.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {contract?.content && (
                <Card title="合同内容" style={{ marginBottom: 16 }}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {contract.content}
                  </Paragraph>
                </Card>
              )}

              {contract?.attachments && contract.attachments.length > 0 && (
                <Card title="附件">
                  <ul>
                    {contract.attachments.map((attachment, index) => (
                      <li key={index}>
                        <a href="#" onClick={(e) => { e.preventDefault(); message.info('下载功能开发中...'); }}>
                          <FileTextOutlined style={{ marginRight: 8 }} />
                          附件 {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Col>

            <Col xs={24} lg={8}>
              <Card title="合同统计" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="合同总额"
                      value={contract?.amount || 0}
                      prefix="¥"
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="已支付"
                      value={totalPaidAmount}
                      prefix="¥"
                      precision={2}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="待支付"
                      value={totalPendingAmount}
                      prefix="¥"
                      precision={2}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="执行进度"
                      value={calculateProgress()}
                      suffix="%"
                      precision={1}
                    />
                  </Col>
                </Row>
              </Card>

              <Card title="付款计划">
                <Timeline>
                  {payments.map(payment => (
                    <Timeline.Item
                      key={payment.id}
                      color={
                        payment.status === 'PAID' ? 'green' :
                        payment.status === 'OVERDUE' ? 'red' : 'orange'
                      }
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Text strong>{payment.description}</Text>
                          <div style={{ marginTop: 4 }}>
                            {getPaymentStatusTag(payment.status)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Text strong style={{ color: '#1890ff' }}>
                            ¥{payment.amount.toLocaleString()}
                          </Text>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            {dayjs(payment.dueDate).format('YYYY-MM-DD')}
                            {payment.paidDate && (
                              <div>支付: {dayjs(payment.paidDate).format('YYYY-MM-DD')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Button type="dashed" block>
                    <PlusOutlined /> 添加付款记录
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="审批详情" key="approval">
          {renderApprovalSteps() || (
            <Card>
              <Alert
                message="暂无审批流程"
                description="此合同尚未发起审批流程，点击右上角的'发起审批'按钮开始审批流程。"
                type="info"
                showIcon
              />
            </Card>
          )}
        </TabPane>

        <TabPane tab="付款记录" key="payments">
          <Card>
            <Table
              columns={[
                {
                  title: '描述',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount: number) => (
                    <Text strong>¥{amount.toLocaleString()}</Text>
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: getPaymentStatusTag,
                },
                {
                  title: '应付日期',
                  dataIndex: 'dueDate',
                  key: 'dueDate',
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
                },
                {
                  title: '实付日期',
                  dataIndex: 'paidDate',
                  key: 'paidDate',
                  render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
                },
                {
                  title: '操作',
                  key: 'action',
                  render: () => (
                    <Button type="link" size="small" icon={<EyeOutlined />}>
                      详情
                    </Button>
                  ),
                },
              ]}
              dataSource={payments}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 编辑合同模态框 */}
      <Modal
        title="编辑合同"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
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
            <Col span={12}>
              <Form.Item name="currency" label="货币">
                <Select>
                  <Option value="CNY">人民币 (¥)</Option>
                  <Option value="USD">美元 ($)</Option>
                  <Option value="EUR">欧元 (€)</Option>
                </Select>
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
              <Form.Item name="status" label="合同状态">
                <Select>
                  <Option value="DRAFT">草稿</Option>
                  <Option value="PENDING">待审批</Option>
                  <Option value="ACTIVE">生效中</Option>
                  <Option value="EXPIRED">已过期</Option>
                  <Option value="TERMINATED">已终止</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="content" label="合同内容">
            <TextArea rows={6} placeholder="请输入合同主要内容" />
          </Form.Item>

          <Form.Item name="attachments" label="附件">
            <TextArea rows={2} placeholder="请输入附件信息，多个附件用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractDetailEnhanced;