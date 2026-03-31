import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Steps,
  Timeline,
  Avatar,
  Divider,
  Comment,
  Input,
  Form,
  Radio,
  message,
  Modal,
  Upload,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PaperClipOutlined,
  SendOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import request from '@/utils/request';
import dayjs from 'dayjs';

const { Step } = Steps;
const { TextArea } = Input;

interface ApprovalDetail {
  id: string;
  title: string;
  type: '报销' | '请假' | '采购' | '人事' | '其他';
  status: '待审批' | '审批中' | '已批准' | '已拒绝' | '已撤回';
  priority: '普通' | '紧急' | '特急';
  applicant: {
    id: string;
    name: string;
    avatar?: string;
    department: string;
    position: string;
  };
  process: {
    id: string;
    name: string;
    version: number;
  };
  currentStep: number;
  steps: ApprovalStep[];
  formData: Record<string, any>;
  attachments: Attachment[];
  comments: CommentItem[];
  history: HistoryItem[];
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  totalAmount?: number;
}

interface ApprovalStep {
  id: string;
  name: string;
  stepType: string;
  approvers: Approver[];
  status: '待处理' | '已通过' | '已拒绝' | '已跳过';
  result?: string;
  completedAt?: string;
  order: number;
}

interface Approver {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

interface CommentItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  isSystem: boolean;
}

interface HistoryItem {
  id: string;
  action: string;
  operator: string;
  details: string;
  createdAt: string;
}

const ApprovalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [commentValue, setCommentValue] = useState('');
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const navigate = useNavigate();

  // 初始化数据
  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  const fetchDetail = async (approvalId: string) => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockData: ApprovalDetail = {
        id: approvalId,
        title: '2024年3月差旅费用报销',
        type: '报销',
        status: '审批中',
        priority: '普通',
        applicant: {
          id: 'user001',
          name: '张三',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          department: '技术部',
          position: '高级工程师',
        },
        process: {
          id: 'process001',
          name: '费用报销流程',
          version: 1,
        },
        currentStep: 2,
        steps: [
          {
            id: 'step1',
            name: '提交申请',
            stepType: '知会',
            approvers: [],
            status: '已通过',
            completedAt: '2024-03-25 09:30:00',
            order: 1,
          },
          {
            id: 'step2',
            name: '部门审批',
            stepType: '审批',
            approvers: [
              {
                id: 'user002',
                name: '李四',
                avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
                role: '部门经理',
              },
            ],
            status: '已通过',
            result: '同意',
            completedAt: '2024-03-25 14:20:00',
            order: 2,
          },
          {
            id: 'step3',
            name: '财务审批',
            stepType: '审批',
            approvers: [
              {
                id: 'user003',
                name: '王五',
                avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
                role: '财务经理',
              },
            ],
            status: '待处理',
            order: 3,
          },
          {
            id: 'step4',
            name: '最终审批',
            stepType: '审批',
            approvers: [
              {
                id: 'user004',
                name: '赵六',
                avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
                role: '总经理',
              },
            ],
            status: '待处理',
            order: 4,
          },
        ],
        formData: {
          expenseType: '差旅费',
          startDate: '2024-03-20',
          endDate: '2024-03-22',
          destination: '上海',
          purpose: '技术交流会议',
          totalAmount: 3850.00,
          items: [
            { type: '交通费', amount: 1200, description: '往返机票' },
            { type: '住宿费', amount: 1800, description: '酒店住宿2晚' },
            { type: '餐饮费', amount: 650, description: '工作餐' },
            { type: '其他', amount: 200, description: '交通补贴' },
          ],
          invoiceCount: 3,
          remark: '会议期间与客户进行技术交流，达成合作意向',
        },
        attachments: [
          {
            id: 'att1',
            name: '机票行程单.pdf',
            size: 1024 * 256,
            type: 'pdf',
            url: '#',
            uploadedAt: '2024-03-25 09:25:00',
          },
          {
            id: 'att2',
            name: '酒店发票.jpg',
            size: 1024 * 512,
            type: 'image',
            url: '#',
            uploadedAt: '2024-03-25 09:26:00',
          },
          {
            id: 'att3',
            name: '会议纪要.docx',
            size: 1024 * 128,
            type: 'doc',
            url: '#',
            uploadedAt: '2024-03-25 09:27:00',
          },
        ],
        comments: [
          {
            id: 'comment1',
            user: {
              id: 'user001',
              name: '张三',
              avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            },
            content: '已提交报销申请，相关票据已上传，请审批。',
            createdAt: '2024-03-25 09:30:00',
            isSystem: false,
          },
          {
            id: 'comment2',
            user: {
              id: 'user002',
              name: '李四',
              avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
            },
            content: '费用合理，同意。',
            createdAt: '2024-03-25 14:20:00',
            isSystem: false,
          },
          {
            id: 'comment3',
            user: {
              id: 'system',
              name: '系统',
              avatar: undefined,
            },
            content: '审批已流转至财务部',
            createdAt: '2024-03-25 14:21:00',
            isSystem: true,
          },
        ],
        history: [
          {
            id: 'hist1',
            action: '创建',
            operator: '张三',
            details: '提交了报销申请',
            createdAt: '2024-03-25 09:30:00',
          },
          {
            id: 'hist2',
            action: '审批',
            operator: '李四',
            details: '部门审批通过',
            createdAt: '2024-03-25 14:20:00',
          },
        ],
        createdAt: '2024-03-25 09:30:00',
        updatedAt: '2024-03-25 14:20:00',
        deadline: '2024-03-30',
        totalAmount: 3850.00,
      };
      setDetail(mockData);
    } catch (error) {
      message.error('获取审批详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleApprove = () => {
    setAction('approve');
    setModalVisible(true);
  };

  const handleReject = () => {
    setAction('reject');
    setModalVisible(true);
  };

  const handleTransfer = () => {
    message.info('转办功能开发中');
  };

  const handleRecall = () => {
    Modal.confirm({
      title: '撤回申请',
      content: '确定要撤回此审批申请吗？',
      onOk: async () => {
        try {
          // 模拟撤回操作
          message.success('撤回成功');
          navigate('/office/approval/my');
        } catch (error) {
          message.error('撤回失败');
        }
      },
    });
  };

  const handleSubmitAction = async () => {
    if (action === 'reject' && !rejectReason.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }

    setSubmitting(true);
    try {
      // 模拟提交操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (action === 'approve') {
        message.success('审批通过');
      } else {
        message.success('已拒绝');
      }
      
      setModalVisible(false);
      setCommentValue('');
      setRejectReason('');
      fetchDetail(id!);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    message.info(`下载文件: ${attachment.name}`);
    // 实际项目中应该调用下载API
  };

  const handleViewAttachment = (attachment: Attachment) => {
    message.info(`预览文件: ${attachment.name}`);
    // 实际项目中应该打开文件预览
  };

  const handleAddComment = async () => {
    if (!commentValue.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    try {
      // 模拟添加评论
      message.success('评论已添加');
      setCommentValue('');
    } catch (error) {
      message.error('添加评论失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      待审批: 'default',
      审批中: 'processing',
      已批准: 'success',
      已拒绝: 'error',
      已撤回: 'warning',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      普通: 'blue',
      紧急: 'orange',
      特急: 'red',
    };
    return colors[priority] || 'default';
  };

  if (!detail) {
    return <div>加载中...</div>;
  }

  return (
    <div className="approval-detail-page">
      {/* 标题和操作区 */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mr-4"
            >
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold mb-2">{detail.title}</h1>
              <Space>
                <Tag color={getStatusColor(detail.status)}>{detail.status}</Tag>
                <Tag color={getPriorityColor(detail.priority)}>{detail.priority}</Tag>
                <Tag color="blue">{detail.type}</Tag>
                <span className="text-gray-600">
                  申请时间: {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </Space>
            </div>
          </div>
          <Space>
            {detail.applicant.id === 'current-user' && detail.status === '审批中' && (
              <Button onClick={handleRecall}>撤回</Button>
            )}
            {detail.status === '审批中' && (
              <>
                <Button onClick={handleTransfer}>转办</Button>
                <Button danger onClick={handleReject}>拒绝</Button>
                <Button type="primary" onClick={handleApprove}>批准</Button>
              </>
            )}
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
        </div>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          {/* 审批流程步骤 */}
          <Card
            title="审批流程"
            className="mb-6"
            extra={
              <div className="text-gray-600">
                当前步骤: {detail.steps.find(s => s.status === '待处理')?.name || '已完成'}
              </div>
            }
          >
            <Steps
              current={detail.currentStep}
              status={detail.status === '已拒绝' ? 'error' : 'process'}
            >
              {detail.steps.map((step, index) => (
                <Step
                  key={step.id}
                  title={step.name}
                  description={
                    <div className="mt-2">
                      {step.approvers.length > 0 && (
                        <div className="mb-2">
                          {step.approvers.map((approver, i) => (
                            <Space key={i} className="mb-1">
                              <Avatar
                                src={approver.avatar}
                                icon={<UserOutlined />}
                                size="small"
                              />
                              <span>{approver.name}</span>
                              <Tag size="small">{approver.role}</Tag>
                            </Space>
                          ))}
                        </div>
                      )}
                      {step.status === '已通过' && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          已通过
                        </Tag>
                      )}
                      {step.status === '已拒绝' && (
                        <Tag color="error" icon={<CloseCircleOutlined />}>
                          已拒绝
                        </Tag>
                      )}
                      {step.status === '待处理' && (
                        <Tag color="processing" icon={<ClockCircleOutlined />}>
                          待处理
                        </Tag>
                      )}
                      {step.completedAt && (
                        <div className="text-gray-500 text-xs mt-1">
                          {dayjs(step.completedAt).format('MM-DD HH:mm')}
                        </div>
                      )}
                    </div>
                  }
                />
              ))}
            </Steps>
          </Card>

          {/* 表单数据 */}
          <Card title="申请详情" className="mb-6">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="申请类型">{detail.formData.expenseType}</Descriptions.Item>
              <Descriptions.Item label="申请事由">{detail.formData.purpose}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{detail.formData.startDate}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{detail.formData.endDate}</Descriptions.Item>
              <Descriptions.Item label="目的地">{detail.formData.destination}</Descriptions.Item>
              <Descriptions.Item label="总金额">
                <span className="text-red-600 font-bold">¥{detail.formData.totalAmount.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="发票数量" span={2}>
                {detail.formData.invoiceCount} 张
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detail.formData.remark}
              </Descriptions.Item>
            </Descriptions>

            {/* 费用明细 */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">费用明细</h4>
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2">费用类型</th>
                    <th className="border border-gray-200 p-2">金额</th>
                    <th className="border border-gray-200 p-2">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-200 p-2">{item.type}</td>
                      <td className="border border-gray-200 p-2">¥{item.amount.toFixed(2)}</td>
                      <td className="border border-gray-200 p-2">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 附件 */}
          <Card title="附件" className="mb-6">
            <Space wrap>
              {detail.attachments.map((attachment) => (
                <Card
                  key={attachment.id}
                  size="small"
                  className="w-48"
                  actions={[
                    <EyeOutlined key="view" onClick={() => handleViewAttachment(attachment)} />,
                    <DownloadOutlined key="download" onClick={() => handleDownloadAttachment(attachment)} />,
                  ]}
                >
                  <div className="flex items-center">
                    <PaperClipOutlined className="mr-2" />
                    <div>
                      <div className="font-medium truncate">{attachment.name}</div>
                      <div className="text-gray-500 text-xs">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          </Card>

          {/* 评论 */}
          <Card title="评论">
            <div className="mb-4">
              <TextArea
                value={commentValue}
                onChange={(e) => setCommentValue(e.target.value)}
                placeholder="请输入评论内容..."
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddComment}
                >
                  发表评论
                </Button>
              </div>
            </div>

            <Divider />

            <div>
              {detail.comments.map((comment) => (
                <Comment
                  key={comment.id}
                  author={<span>{comment.user.name}</span>}
                  avatar={
                    <Avatar
                      src={comment.user.avatar}
                      icon={<UserOutlined />}
                    />
                  }
                  content={<p>{comment.content}</p>}
                  datetime={
                    <span>
                      {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  }
                />
              ))}
            </div>
          </Card>
        </Col>

        <Col span={8}>
          {/* 申请人信息 */}
          <Card title="申请人" className="mb-6">
            <div className="flex items-center">
              <Avatar
                src={detail.applicant.avatar}
                icon={<UserOutlined />}
                size={64}
                className="mr-4"
              />
              <div>
                <div className="text-lg font-bold">{detail.applicant.name}</div>
                <div className="text-gray-600">{detail.applicant.department}</div>
                <div className="text-gray-500">{detail.applicant.position}</div>
              </div>
            </div>
          </Card>

          {/* 流程信息 */}
          <Card title="流程信息" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="流程名称">
                {detail.process.name} (v{detail.process.version})
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新">
                {dayjs(detail.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {detail.deadline && (
                <Descriptions.Item label="截止时间">
                  <span className={dayjs(detail.deadline).isBefore(dayjs()) ? 'text-red-600' : ''}>
                    {dayjs(detail.deadline).format('YYYY-MM-DD')}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 统计信息 */}
          <Card title="统计信息" className="mb-6">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="总金额"
                  value={detail.totalAmount}
                  prefix="¥"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="处理时长"
                  value={Math.ceil(dayjs().diff(dayjs(detail.createdAt), 'hour', true))}
                  suffix="小时"
                />
              </Col>
            </Row>
            <Row gutter={16} className="mt-4">
              <Col span={12}>
                <Statistic
                  title="附件数量"
                  value={detail.attachments.length}
                  suffix="个"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="评论数量"
                  value={detail.comments.length}
                  suffix="条"
                />
              </Col>
            </Row>
          </Card>

          {/* 操作历史 */}
          <Card
            title="操作历史"
            extra={
              <Button
                type="link"
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => navigate(`/office/approval/history/${detail.id}`)}
              >
                查看详情
              </Button>
            }
          >
            <Timeline>
              {detail.history.map((item) => (
                <Timeline.Item key={item.id}>
                  <div className="text-sm">
                    <div className="font-medium">{item.action}</div>
                    <div className="text-gray-600">{item.details}</div>
                    <div className="text-gray-400 text-xs">
                      {item.operator} • {dayjs(item.createdAt).format('MM-DD HH:mm')}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* 审批操作模态框 */}
      <Modal
        title={action === 'approve' ? '审批通过' : '审批拒绝'}
        open={modalVisible}
        onOk={handleSubmitAction}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
      >
        <Form layout="vertical">
          {action === 'reject' && (
            <Form.Item
              label="拒绝原因"
              required
              help="请详细说明拒绝的理由"
            >
              <TextArea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                rows={3}
              />
            </Form.Item>
          )}
          <Form.Item label="审批意见">
            <TextArea
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              placeholder="请输入审批意见..."
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalDetailPage;