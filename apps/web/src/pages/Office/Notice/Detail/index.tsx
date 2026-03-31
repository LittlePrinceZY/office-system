import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Avatar,
  Space,
  Tag,
  Divider,
  Button,
  Row,
  Col,
  List,
  Comment,
  Input,
  Badge,
  Descriptions,
  Dropdown,
  Menu,
  message,
  Modal,
  Upload,
  Skeleton,
  Rate,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  LikeOutlined,
  DislikeOutlined,
  StarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PaperClipOutlined,
  TagOutlined,
  FileTextOutlined,
  HistoryOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import request from '@/utils/request';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface NoticeDetail {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: '通知' | '公告' | '新闻' | '政策' | '活动';
  type: '普通' | '重要' | '紧急';
  status: '已发布' | '草稿' | '已删除';
  author: {
    id: string;
    name: string;
    avatar?: string;
    department: string;
    position: string;
  };
  publishTime: string;
  expireTime?: string;
  readCount: number;
  likeCount: number;
  commentCount: number;
  attachments: Attachment[];
  tags: string[];
  importance: number; // 1-5
  canComment: boolean;
  needConfirm: boolean;
  confirmCount: number;
  scope: string[]; // 可见范围
  viewers: Viewer[];
  isPinned: boolean;
  metadata: Record<string, any>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploader: {
    id: string;
    name: string;
  };
}

interface Viewer {
  id: string;
  name: string;
  avatar?: string;
  viewedAt: string;
}

interface CommentItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  replies: CommentItem[];
}

const NoticeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<NoticeDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const navigate = useNavigate();

  // 初始化数据
  useEffect(() => {
    if (id) {
      fetchDetail(id);
      fetchComments(id);
    }
  }, [id]);

  const fetchDetail = async (noticeId: string) => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockData: NoticeDetail = {
        id: noticeId,
        title: '关于2024年度员工健康体检安排的通知',
        content: `## 各位同事：

根据公司年度健康管理工作安排，为保障员工身体健康，提升工作效率，公司人力资源部联合指定医疗机构，组织2024年度员工健康体检。

### 一、体检时间
- **预约时间**：2024年4月1日 - 2024年4月15日
- **体检时间**：2024年4月16日 - 2024年5月31日（具体时间以预约为准）
- **工作时间**：周一至周五 8:00-12:00，13:30-17:30

### 二、体检地点
- **主检机构**：市人民医院健康体检中心
- **地址**：XX市XX区人民路123号
- **联系电话**：123-4567-8900

### 三、体检对象
- 公司在职正式员工
- 入职满3个月的试用期员工
- 退休返聘人员（自愿参加）

### 四、体检项目
1. **基础项目**：身高、体重、血压、视力等
2. **实验室检查**：血常规、尿常规、肝功能、肾功能、血糖、血脂等
3. **影像学检查**：胸片、心电图、腹部B超
4. **专科检查**：内科、外科、五官科
5. **特殊项目**（根据年龄和需求）：
   - 40岁以上：肿瘤标志物筛查
   - 女性：妇科检查、乳腺B超
   - 男性：前列腺B超

### 五、预约方式
1. **线上预约**：登录公司内部系统 → 健康管理 → 体检预约
2. **电话预约**：拨打人力资源部电话 123-4567-8900
3. **现场预约**：人力资源部办公室（行政楼3楼301室）

### 六、注意事项
1. 体检前3天保持正常饮食，勿饮酒
2. 体检前1天晚8点后禁食，可饮少量白开水
3. 体检当日早晨空腹，勿喝水
4. 穿着宽松衣物，女性请避免穿连衣裙
5. 携带身份证原件和体检通知单

### 七、体检报告
1. 纸质报告：体检后10个工作日内送达部门
2. 电子报告：同步推送至个人健康档案
3. 结果解读：如有异常指标，公司将安排专家解读

### 八、联系方式
- 人力资源部：张经理，分机：1234
- 健康管理中心：李医生，分机：5678

请各部门负责人及时传达通知，并组织员工按时完成体检预约。

**感谢大家的配合！**

**人力资源部**
**2024年3月31日**`,
        summary: '2024年度员工健康体检安排通知，包括体检时间、地点、项目、预约方式和注意事项等。',
        category: '通知',
        type: '重要',
        status: '已发布',
        author: {
          id: 'user001',
          name: '张经理',
          avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
          department: '人力资源部',
          position: '部门经理',
        },
        publishTime: '2024-03-31 09:00:00',
        expireTime: '2024-06-30 23:59:59',
        readCount: 245,
        likeCount: 89,
        commentCount: 23,
        attachments: [
          {
            id: 'att1',
            name: '体检安排通知.pdf',
            size: 1024 * 512,
            type: 'pdf',
            url: '#',
            uploadedAt: '2024-03-30 14:30:00',
            uploader: {
              id: 'user001',
              name: '张经理',
            },
          },
          {
            id: 'att2',
            name: '体检项目说明.docx',
            size: 1024 * 256,
            type: 'doc',
            url: '#',
            uploadedAt: '2024-03-30 14:35:00',
            uploader: {
              id: 'user001',
              name: '张经理',
            },
          },
          {
            id: 'att3',
            name: '体检流程示意图.png',
            size: 1024 * 1024,
            type: 'image',
            url: '#',
            uploadedAt: '2024-03-30 14:40:00',
            uploader: {
              id: 'user001',
              name: '张经理',
            },
          },
        ],
        tags: ['健康体检', '员工福利', '人力资源', '年度安排'],
        importance: 4,
        canComment: true,
        needConfirm: true,
        confirmCount: 156,
        scope: ['全员', '正式员工', '试用期员工'],
        viewers: [
          {
            id: 'user002',
            name: '李四',
            avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
            viewedAt: '2024-03-31 09:15:00',
          },
          {
            id: 'user003',
            name: '王五',
            avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
            viewedAt: '2024-03-31 10:30:00',
          },
        ],
        isPinned: true,
        metadata: {
          priority: '高',
          department: '人力资源部',
          approvalStatus: '已审批',
          approvalTime: '2024-03-30 16:00:00',
          approvedBy: '刘总',
        },
        version: 2,
        createdAt: '2024-03-30 14:20:00',
        updatedAt: '2024-03-31 08:45:00',
      };
      setDetail(mockData);
      
      // 检查当前用户是否已确认
      setHasConfirmed(false); // 实际应用中应从API获取
    } catch (error) {
      message.error('获取公告详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (noticeId: string) => {
    try {
      // 模拟API调用
      const mockComments: CommentItem[] = [
        {
          id: 'comment1',
          user: {
            id: 'user002',
            name: '李四',
            avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
            role: '技术部主管',
          },
          content: '体检时间安排很合理，已经预约了4月20日上午的体检。感谢公司的安排！',
          createdAt: '2024-03-31 09:30:00',
          likeCount: 15,
          replyCount: 3,
          isLiked: false,
          replies: [
            {
              id: 'reply1',
              user: {
                id: 'user001',
                name: '张经理',
                avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
                role: '人力资源部经理',
              },
              content: '感谢支持！体检中心会提前短信提醒，请注意查收。',
              createdAt: '2024-03-31 10:00:00',
              likeCount: 8,
              replyCount: 0,
              isLiked: false,
              replies: [],
            },
          ],
        },
        {
          id: 'comment2',
          user: {
            id: 'user003',
            name: '王五',
            avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
            role: '财务部员工',
          },
          content: '请问周末可以体检吗？工作日不太方便请假。',
          createdAt: '2024-03-31 11:15:00',
          likeCount: 7,
          replyCount: 1,
          isLiked: true,
          replies: [
            {
              id: 'reply2',
              user: {
                id: 'user001',
                name: '张经理',
                avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
                role: '人力资源部经理',
              },
              content: '周末需要提前预约，体检中心提供周六上午的体检服务，请提前一周预约。',
              createdAt: '2024-03-31 14:30:00',
              likeCount: 5,
              replyCount: 0,
              isLiked: false,
              replies: [],
            },
          ],
        },
      ];
      setComments(mockComments);
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleLike = async () => {
    if (likeLoading || !detail) return;
    
    setLikeLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const wasLiked = false; // 实际应用中应从状态获取
      const newLikeCount = wasLiked ? detail.likeCount - 1 : detail.likeCount + 1;
      
      setDetail({
        ...detail,
        likeCount: newLikeCount,
      });
      
      message.success(wasLiked ? '已取消点赞' : '点赞成功');
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || commentLoading || !detail) {
      message.warning('请输入评论内容');
      return;
    }

    setCommentLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCommentItem: CommentItem = {
        id: `comment_${Date.now()}`,
        user: {
          id: 'current-user',
          name: '当前用户',
          avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
          role: '员工',
        },
        content: newComment,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
        replies: [],
      };
      
      setComments([newCommentItem, ...comments]);
      setNewComment('');
      message.success('评论发表成功');
    } catch (error) {
      message.error('评论发表失败');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }

    try {
      // 模拟API调用
      const newReply: CommentItem = {
        id: `reply_${Date.now()}`,
        user: {
          id: 'current-user',
          name: '当前用户',
          avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
          role: '员工',
        },
        content: replyContent,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
        replies: [],
      };

      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...comment.replies, newReply],
            replyCount: comment.replyCount + 1,
          };
        }
        return comment;
      });

      setComments(updatedComments);
      setReplyingTo(null);
      setReplyContent('');
      message.success('回复成功');
    } catch (error) {
      message.error('回复失败');
    }
  };

  const handleConfirm = async () => {
    try {
      // 模拟确认操作
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasConfirmed(true);
      setConfirmModalVisible(false);
      
      if (detail) {
        setDetail({
          ...detail,
          confirmCount: detail.confirmCount + 1,
        });
      }
      
      message.success('已确认收到通知');
    } catch (error) {
      message.error('确认失败');
    }
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    message.info(`下载文件: ${attachment.name}`);
    // 实际项目中应该调用下载API
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: detail?.title,
        text: detail?.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success('链接已复制到剪贴板');
    }
  };

  const handleEdit = () => {
    if (detail) {
      navigate(`/office/notice/edit/${detail.id}`);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '删除公告',
      content: '确定要删除此公告吗？删除后将无法恢复。',
      onOk: async () => {
        try {
          // 模拟删除操作
          message.success('删除成功');
          navigate('/office/notice');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      普通: 'blue',
      重要: 'orange',
      紧急: 'red',
    };
    return colors[type] || 'default';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      通知: 'green',
      公告: 'blue',
      新闻: 'purple',
      政策: 'cyan',
      活动: 'orange',
    };
    return colors[category] || 'default';
  };

  if (loading) {
    return (
      <div className="notice-detail-page">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="notice-detail-page">
        <Card>
          <Title level={4}>公告不存在</Title>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回公告列表
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="notice-detail-page">
      {/* 标题和操作区 */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mb-4"
            >
              返回
            </Button>
            <Space direction="vertical" size="small">
              <div className="flex items-center">
                {detail.isPinned && (
                  <Badge.Ribbon text="置顶" color="red" className="mr-2">
                    <div></div>
                  </Badge.Ribbon>
                )}
                <Title level={2}>{detail.title}</Title>
              </div>
              <Space>
                <Tag color={getTypeColor(detail.type)} icon={<BellOutlined />}>
                  {detail.type}
                </Tag>
                <Tag color={getCategoryColor(detail.category)} icon={<TagOutlined />}>
                  {detail.category}
                </Tag>
                <Text type="secondary">
                  <ClockCircleOutlined className="mr-1" />
                  发布时间: {dayjs(detail.publishTime).format('YYYY-MM-DD HH:mm')}
                </Text>
                {detail.expireTime && (
                  <Text type="secondary">
                    有效期至: {dayjs(detail.expireTime).format('YYYY-MM-DD')}
                  </Text>
                )}
              </Space>
            </Space>
          </div>
          <Space>
            <Tooltip title="分享">
              <Button icon={<ShareAltOutlined />} onClick={handleShare} />
            </Tooltip>
            <Tooltip title="编辑">
              <Button icon={<EditOutlined />} onClick={handleEdit} />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDelete}
              />
            </Tooltip>
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={18}>
          {/* 作者信息 */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <Space size="large">
                <Space>
                  <Avatar
                    src={detail.author.avatar}
                    icon={<UserOutlined />}
                    size={48}
                  />
                  <div>
                    <div className="font-medium text-lg">{detail.author.name}</div>
                    <div className="text-gray-600">
                      {detail.author.department} • {detail.author.position}
                    </div>
                  </div>
                </Space>
                <Divider type="vertical" />
                <Space direction="vertical" size="small">
                  <div className="text-gray-500 text-sm">
                    公告类型: <Tag color="blue">{detail.category}</Tag>
                  </div>
                  <div className="text-gray-500 text-sm">
                    可见范围: <Tag color="green">{detail.scope.join(', ')}</Tag>
                  </div>
                </Space>
              </Space>
              <Space>
                <Rate
                  value={detail.importance}
                  character={<StarOutlined />}
                  disabled
                />
                <Text type="secondary">重要程度</Text>
              </Space>
            </div>
          </Card>

          {/* 公告内容 */}
          <Card title="公告内容" className="mb-6">
            <div className="markdown-content">
              <ReactMarkdown>{detail.content}</ReactMarkdown>
            </div>
            <style jsx>{`
              .markdown-content {
                font-size: 16px;
                line-height: 1.8;
              }
              .markdown-content h1, 
              .markdown-content h2, 
              .markdown-content h3 {
                margin-top: 24px;
                margin-bottom: 16px;
                font-weight: 600;
              }
              .markdown-content p {
                margin-bottom: 16px;
              }
              .markdown-content ul, 
              .markdown-content ol {
                margin-bottom: 16px;
                padding-left: 24px;
              }
            `}</style>
          </Card>

          {/* 附件 */}
          <Card title="附件" className="mb-6">
            <List
              dataSource={detail.attachments}
              renderItem={(attachment) => (
                <List.Item
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => message.info(`预览: ${attachment.name}`)}
                    >
                      预览
                    </Button>,
                    <Button
                      key="download"
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      下载
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<PaperClipOutlined />}
                    title={attachment.name}
                    description={
                      <Space>
                        <Text type="secondary">
                          大小: {(attachment.size / 1024).toFixed(1)} KB
                        </Text>
                        <Text type="secondary">
                          上传: {dayjs(attachment.uploadedAt).format('MM-DD HH:mm')}
                        </Text>
                        <Text type="secondary">
                          上传者: {attachment.uploader.name}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* 评论区域 */}
          <Card title="评论">
            {/* 评论表单 */}
            {detail.canComment && (
              <div className="mb-6">
                <TextArea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="请输入您的评论..."
                  rows={4}
                  maxLength={500}
                  showCount
                />
                <div className="mt-3 flex justify-between">
                  <Space>
                    <Button
                      icon={<LikeOutlined />}
                      onClick={handleLike}
                      loading={likeLoading}
                    >
                      {detail.likeCount} 赞
                    </Button>
                    <Text type="secondary">
                      <EyeOutlined className="mr-1" />
                      {detail.readCount} 阅读
                    </Text>
                  </Space>
                  <Button
                    type="primary"
                    onClick={handleCommentSubmit}
                    loading={commentLoading}
                  >
                    发表评论
                  </Button>
                </div>
              </div>
            )}

            <Divider orientation="left">
              {detail.commentCount} 条评论
            </Divider>

            {/* 评论列表 */}
            <div>
              {comments.map((comment) => (
                <div key={comment.id} className="mb-6">
                  <Comment
                    author={
                      <Space>
                        <span className="font-medium">{comment.user.name}</span>
                        <Tag size="small">{comment.user.role}</Tag>
                      </Space>
                    }
                    avatar={
                      <Avatar
                        src={comment.user.avatar}
                        icon={<UserOutlined />}
                      />
                    }
                    content={<Paragraph>{comment.content}</Paragraph>}
                    datetime={
                      <Space>
                        <Text type="secondary">
                          {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                          <Text type="secondary" className="text-xs">
                            (编辑于 {dayjs(comment.updatedAt).format('MM-DD HH:mm')})
                          </Text>
                        )}
                      </Space>
                    }
                    actions={[
                      <Button
                        key="like"
                        type="text"
                        icon={<LikeOutlined />}
                        size="small"
                      >
                        {comment.likeCount}
                      </Button>,
                      <Button
                        key="reply"
                        type="text"
                        size="small"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        回复
                      </Button>,
                    ]}
                  />

                  {/* 回复内容 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-12 mt-4">
                      {comment.replies.map((reply) => (
                        <Comment
                          key={reply.id}
                          author={
                            <Space>
                              <span className="font-medium">{reply.user.name}</span>
                              <Tag size="small">{reply.user.role}</Tag>
                            </Space>
                          }
                          avatar={
                            <Avatar
                              src={reply.user.avatar}
                              icon={<UserOutlined />}
                              size={32}
                            />
                          }
                          content={<Paragraph>{reply.content}</Paragraph>}
                          datetime={
                            <Text type="secondary">
                              {dayjs(reply.createdAt).format('MM-DD HH:mm')}
                            </Text>
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* 回复表单 */}
                  {replyingTo === comment.id && (
                    <div className="ml-12 mt-4">
                      <TextArea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`回复 @${comment.user.name}...`}
                        rows={3}
                        autoFocus
                      />
                      <div className="mt-2 flex justify-end space-x-2">
                        <Button size="small" onClick={() => setReplyingTo(null)}>
                          取消
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleReplySubmit(comment.id)}
                        >
                          发送
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          {/* 统计信息 */}
          <Card title="统计信息" className="mb-6">
            <Space direction="vertical" size="middle" className="w-full">
              <div className="text-center">
                <Title level={3}>{detail.readCount}</Title>
                <Text type="secondary">阅读人数</Text>
              </div>
              <Divider />
              <div className="text-center">
                <Title level={3}>{detail.likeCount}</Title>
                <Text type="secondary">点赞数</Text>
              </div>
              <Divider />
              <div className="text-center">
                <Title level={3}>{detail.confirmCount}</Title>
                <Text type="secondary">已确认人数</Text>
              </div>
            </Space>
          </Card>

          {/* 确认按钮 */}
          {detail.needConfirm && !hasConfirmed && (
            <Card className="mb-6">
              <div className="text-center">
                <BellOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <div className="mt-3 mb-4">
                  <Text>请确认您已收到此通知</Text>
                </div>
                <Button
                  type="primary"
                  block
                  onClick={() => setConfirmModalVisible(true)}
                >
                  确认收到
                </Button>
              </div>
            </Card>
          )}

          {/* 标签 */}
          <Card title="标签" className="mb-6">
            <Space wrap>
              {detail.tags.map((tag, index) => (
                <Tag key={index} color="blue">
                  {tag}
                </Tag>
              ))}
            </Space>
          </Card>

          {/* 元数据 */}
          <Card title="详细信息" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="公告ID">
                <Text copyable>{detail.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="发布人">
                {detail.author.name}
              </Descriptions.Item>
              <Descriptions.Item label="部门">
                {detail.author.department}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新">
                {dayjs(detail.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="版本">
                v{detail.version}
              </Descriptions.Item>
              {detail.metadata.approvalStatus && (
                <Descriptions.Item label="审批状态">
                  <Tag color="green">{detail.metadata.approvalStatus}</Tag>
                </Descriptions.Item>
              )}
              {detail.metadata.approvedBy && (
                <Descriptions.Item label="审批人">
                  {detail.metadata.approvedBy}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 最近浏览者 */}
          <Card
            title="最近浏览"
            extra={<Badge count={detail.viewers.length} />}
          >
            <List
              dataSource={detail.viewers}
              renderItem={(viewer) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={viewer.avatar}
                        icon={<UserOutlined />}
                        size="small"
                      />
                    }
                    title={viewer.name}
                    description={
                      <Text type="secondary">
                        {dayjs(viewer.viewedAt).format('HH:mm')}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 确认模态框 */}
      <Modal
        title="确认收到通知"
        open={confirmModalVisible}
        onOk={handleConfirm}
        onCancel={() => setConfirmModalVisible(false)}
        okText="确认收到"
        cancelText="取消"
      >
        <div className="text-center py-4">
          <BellOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <div className="mt-4">
            <Text>请确认您已阅读并理解通知内容</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoticeDetailPage;