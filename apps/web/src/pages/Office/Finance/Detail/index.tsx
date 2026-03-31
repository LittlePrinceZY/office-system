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
  Descriptions,
  Divider,
  Timeline,
  Avatar,
  List,
  Image,
  message,
  Popconfirm,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  FileOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../../stores/auth';
import request from '../../../../utils/request';
import dayjs from 'dayjs';
import './style.css';

const { Title, Text } = Typography;

interface ReimbursementDetail {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  attachments: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  createdAt: string;
  updatedAt: string;
  applicant: {
    id: string;
    realName: string;
    avatar?: string;
    department?: { name: string };
    position?: string;
  };
  approverId?: string;
  approvedAt?: string;
  comment?: string;
  approver?: {
    id: string;
    realName: string;
    avatar?: string;
  };
}

interface ApprovalInfo {
  id: string;
  title: string;
  status: string;
  currentNode?: string;
  tasks?: ApprovalTask[];
}

interface ApprovalTask {
  id: string;
  nodeName: string;
  action?: string;
  comment?: string;
  approver?: {
    realName: string;
    avatar?: string;
  };
  createdAt: string;
  processedAt?: string;
}

interface TimelineItem {
  time: string;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

const ReimbursementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ReimbursementDetail | null>(null);
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo | null>(null);
  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    type: 'approve' as 'approve' | 'reject',
  });

  useEffect(() => {
    if (id) {
      fetchDetail();
      fetchApprovalInfo();
    }
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await request.get(`/finance/reimbursements/${id}`);
      setDetail(data);
    } catch (error) {
      message.error('获取报销详情失败');
      navigate('/office/finance');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalInfo = async () => {
    try {
      // 根据报销ID查找相关的审批流程
      const approvals = await request.get('/approvals', {
        params: { title: `报销申请 - ¥${id}` },
      });
      
      if (approvals.list && approvals.list.length > 0) {
        const approval = approvals.list[0];
        // 获取审批任务详情
        const approvalDetail = await request.get(`/approvals/${approval.id}`);
        setApprovalInfo(approvalDetail);
      }
    } catch (error) {
      console.error('获取审批信息失败:', error);
      // 不显示错误，因为报销可能没有关联审批流程
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      TRAVEL: '差旅费',
      MEAL: '餐费',
      OFFICE: '办公费',
      ENTERTAINMENT: '招待费',
      OTHER: '其他',
    };
    return types[type] || type;
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="processing">待审批</Tag>;
      case 'APPROVED':
        return <Tag color="success">已通过</Tag>;
      case 'REJECTED':
        return <Tag color="error">已驳回</Tag>;
      case 'PAID':
        return <Tag color="default">已付款</Tag>;
      default:
        return null;
    }
  };

  const getTimelineItems = (): TimelineItem[] => {
    if (!detail) return [];

    const items: TimelineItem[] = [
      {
        time: dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm'),
        title: '提交申请',
        description: `${detail.applicant.realName} 提交了报销申请`,
        color: 'blue',
        icon: <UserOutlined />,
      },
    ];

    if (detail.approvedAt && detail.approver) {
      const isApproved = detail.status === 'APPROVED' || detail.status === 'PAID';
      items.push({
        time: dayjs(detail.approvedAt).format('YYYY-MM-DD HH:mm'),
        title: isApproved ? '审批通过' : '审批驳回',
        description: `${detail.approver.realName} 处理了申请${detail.comment ? `，备注：${detail.comment}` : ''}`,
        color: isApproved ? 'green' : 'red',
        icon: isApproved ? <CheckOutlined /> : <CloseOutlined />,
      });
    }

    if (detail.status === 'PAID') {
      items.push({
        time: dayjs(detail.updatedAt).format('YYYY-MM-DD HH:mm'),
        title: '已付款',
        description: '报销款项已支付',
        color: 'purple',
        icon: <DollarOutlined />,
      });
    }

    return items;
  };

  const handleApprove = (type: 'approve' | 'reject') => {
    setApprovalModal({
      visible: true,
      type,
    });
  };

  const handleApprovalSubmit = async (values: any) => {
    try {
      await request.post(`/finance/reimbursements/${id}/approve`, {
        status: approvalModal.type === 'approve' ? 'APPROVED' : 'REJECTED',
        comment: values.comment || '',
      });
      message.success(approvalModal.type === 'approve' ? '报销已批准' : '报销已驳回');
      setApprovalModal({ visible: false, type: 'approve' });
      fetchDetail();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await request.post(`/finance/reimbursements/${id}/pay`);
      message.success('已标记为已付款');
      fetchDetail();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDownloadAttachment = (url: string) => {
    // 这里应该实现文件下载逻辑
    window.open(url, '_blank');
  };

  if (!detail) {
    return <div>加载中...</div>;
  }

  return (
    <div className="reimbursement-detail-page">
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/office/finance')}
        >
          返回列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          报销申请详情
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="基本信息" className="detail-card">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="报销类型">
                {getTypeLabel(detail.type)}
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                <Text strong>{detail.currency} {detail.amount.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="报销日期">
                {dayjs(detail.date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                {getStatusTag(detail.status)}
              </Descriptions.Item>
              <Descriptions.Item label="申请说明" span={2}>
                {detail.description}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {detail.attachments && detail.attachments.length > 0 && (
            <Card title="附件" className="detail-card" style={{ marginTop: 24 }}>
              <List
                dataSource={detail.attachments}
                renderItem={(url, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<FileOutlined style={{ fontSize: 24 }} />}
                      title={`附件 ${index + 1}`}
                      description={url.split('/').pop()}
                    />
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadAttachment(url)}
                    >
                      下载
                    </Button>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="申请人信息" className="detail-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar
                size={64}
                src={detail.applicant.avatar}
                icon={<UserOutlined />}
              />
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  {detail.applicant.realName}
                </Title>
                <Text type="secondary">
                  {detail.applicant.department?.name || '未分配部门'}
                  {detail.applicant.position && ` · ${detail.applicant.position}`}
                </Text>
              </div>
            </div>
          </Card>

          <Card title="审批流程" className="detail-card" style={{ marginTop: 24 }}>
            <Timeline items={getTimelineItems().map(item => ({
              color: item.color,
              dot: item.icon,
              children: (
                <div>
                  <Text strong>{item.title}</Text>
                  <div>{item.description}</div>
                  <Text type="secondary">{item.time}</Text>
                </div>
              ),
            }))} />
          </Card>

          {/* 审批操作 */}
          {user?.isAdmin && detail.status === 'PENDING' && (
            <Card title="审批操作" className="detail-card" style={{ marginTop: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove('approve')}
                >
                  批准申请
                </Button>
                <Button
                  type="primary"
                  danger
                  block
                  icon={<CloseOutlined />}
                  onClick={() => handleApprove('reject')}
                >
                  驳回申请
                </Button>
              </Space>
            </Card>
          )}

          {/* 标记付款 */}
          {user?.isAdmin && detail.status === 'APPROVED' && (
            <Card title="付款操作" className="detail-card" style={{ marginTop: 24 }}>
              <Popconfirm
                title="确认标记为已付款？"
                onConfirm={handleMarkAsPaid}
              >
                <Button
                  type="primary"
                  block
                  icon={<DollarOutlined />}
                >
                  标记为已付款
                </Button>
              </Popconfirm>
            </Card>
          )}
        </Col>
      </Row>

      {/* 审批模态框 */}
      <Modal
        title={approvalModal.type === 'approve' ? '批准报销申请' : '驳回报销申请'}
        open={approvalModal.visible}
        onCancel={() => setApprovalModal({ visible: false, type: 'approve' })}
        footer={null}
        width={500}
      >
        <Form layout="vertical" onFinish={handleApprovalSubmit}>
          <Form.Item
            name="comment"
            label="审批意见"
            rules={[{ required: approvalModal.type === 'reject', message: '请填写驳回理由' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={approvalModal.type === 'approve' ? '请输入批准意见（可选）' : '请输入驳回理由'}
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setApprovalModal({ visible: false, type: 'approve' })}>
                取消
              </Button>
              <Button
                type={approvalModal.type === 'approve' ? 'primary' : 'danger'}
                htmlType="submit"
              >
                {approvalModal.type === 'approve' ? '批准' : '驳回'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReimbursementDetailPage;