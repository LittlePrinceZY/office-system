import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  List,
  Tag,
  Typography,
  Button,
  Space,
  Badge,
  Empty,
  Skeleton,
  Tabs,
} from 'antd';
import {
  EyeOutlined,
  ClockCircleOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/auth';
import request from '../../../utils/request';
import dayjs from 'dayjs';
import './style.css';

const { Title, Text, Paragraph } = Typography;

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: { name: string };
  isTop: boolean;
  isPublished: boolean;
  publishedAt: string;
  author: { realName: string };
  viewCount: number;
  readCount: number;
  isRead: boolean;
}

interface Category {
  id: string;
  name: string;
  code: string;
}

const Announcements: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchAnnouncements();
    fetchUnreadCount();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await request.get('/announcements/categories/list');
      setCategories(data);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchAnnouncements = async (categoryId?: string) => {
    setLoading(true);
    try {
      const params: any = { pageSize: 50, isPublished: true };
      if (categoryId && categoryId !== 'all') {
        params.categoryId = categoryId;
      }
      const data = await request.get('/announcements', { params });
      setAnnouncements(data.list);
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await request.get('/announcements/stats/unread');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('获取未读数失败:', error);
    }
  };

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    fetchAnnouncements(key === 'all' ? undefined : key);
  };

  const handleViewAnnouncement = async (id: string) => {
    navigate(`/office/announcements/${id}`);
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    ...categories.map((cat) => ({ key: cat.id, label: cat.name })),
  ];

  return (
    <div className="announcements-page">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          公示公告
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ marginLeft: 12 }} />
          )}
        </Title>
        {user?.isAdmin && (
          <Button type="primary" onClick={() => navigate('/office/announcements/create')}>
            发布公告
          </Button>
        )}
      </div>

      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        items={tabItems}
        className="category-tabs"
      />

      <Card className="announcements-list-card">
        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : announcements.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={announcements}
            renderItem={(item) => (
              <List.Item
                className={`announcement-item ${item.isRead ? 'read' : 'unread'}`}
                onClick={() => handleViewAnnouncement(item.id)}
              >
                <div className="announcement-header">
                  <Space>
                    {item.isTop && (
                      <Tag color="red" icon={<PushpinOutlined />}>
                        置顶
                      </Tag>
                    )}
                    <Tag color="blue">{item.category.name}</Tag>
                    {!item.isRead && <Badge status="processing" text="未读" />}
                  </Space>
                  <Text type="secondary">
                    <ClockCircleOutlined /> {dayjs(item.publishedAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>

                <Title level={4} className="announcement-title">
                  {item.title}
                </Title>

                <Paragraph ellipsis={{ rows: 2 }} className="announcement-content">
                  {item.content.replace(/<[^>]+>/g, '')}
                </Paragraph>

                <div className="announcement-footer">
                  <Space>
                    <Text type="secondary">发布人: {item.author.realName}</Text>
                    <Text type="secondary">
                      <EyeOutlined /> {item.viewCount} 次阅读
                    </Text>
                  </Space>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无公告" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
};

export default Announcements;
