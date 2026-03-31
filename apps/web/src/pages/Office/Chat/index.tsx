import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Layout,
  List,
  Avatar,
  Input,
  Button,
  Typography,
  Badge,
  Empty,
  Dropdown,
  Menu,
  message,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  MoreOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../../stores/auth';
import request from '../../../utils/request';
import dayjs from 'dayjs';
import './style.css';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

interface Chat {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string;
  avatar?: string;
  members: any[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  type: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    realName: string;
    avatar?: string;
  };
  isRecalled?: boolean;
}

const ChatPage: React.FC = () => {
  const location = useLocation();
  const { user, token } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    initSocket();

    // 检查是否有目标用户ID（从通讯录跳转）
    const targetUserId = (location.state as any)?.targetUserId;
    if (targetUserId) {
      createPrivateChat(targetUserId);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      socketRef.current?.emit('join_chat', selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initSocket = () => {
    const socket = io(import.meta.env.VITE_WS_URL || '', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('authenticate', token);
    });

    socket.on('new_message', (data: { chatId: string; message: Message }) => {
      if (data.chatId === selectedChat?.id) {
        setMessages((prev) => [...prev, data.message]);
      }
      fetchChats(); // 更新聊天列表
    });

    socketRef.current = socket;
  };

  const fetchChats = async () => {
    try {
      const data = await request.get('/chat/chats');
      setChats(data);
    } catch (error) {
      console.error('获取聊天列表失败:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setLoading(true);
    try {
      const data = await request.get(`/chat/chats/${chatId}/messages`);
      setMessages(data.list);
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPrivateChat = async (targetUserId: string) => {
    try {
      const chat = await request.post('/chat/chats/private', { targetUserId });
      setSelectedChat(chat);
      fetchChats();
    } catch (error) {
      console.error('创建私聊失败:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat) return;

    try {
      const message = await request.post(`/chat/chats/${selectedChat.id}/messages`, {
        type: 'TEXT',
        content: inputMessage,
      });

      socketRef.current?.emit('send_message', {
        chatId: selectedChat.id,
        message,
      });

      setInputMessage('');
    } catch (error) {
      message.error('发送失败');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.avatar) return chat.avatar;
    return chat.type === 'GROUP' ? undefined : undefined;
  };

  const getChatName = (chat: Chat) => {
    return chat.name || (chat.type === 'GROUP' ? '群聊' : '未知用户');
  };

  return (
    <Layout className="chat-layout">
      <Sider width={320} className="chat-sider">
        <div className="chat-sider-header">
          <Title level={4} style={{ margin: 0 }}>消息</Title>
          <Button type="primary" icon={<PlusOutlined />} size="small">
            新建
          </Button>
        </div>
        
        <div className="chat-search">
          <Input.Search
            placeholder="搜索聊天"
            prefix={<SearchOutlined />}
          />
        </div>
        
        <List
          className="chat-list"
          dataSource={chats}
          renderItem={(chat) => (
            <List.Item
              className={`chat-list-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={chat.unreadCount} size="small">
                    <Avatar
                      src={getChatAvatar(chat)}
                      icon={chat.type === 'GROUP' ? <TeamOutlined /> : <UserOutlined />}
                      size="large"
                    />
                  </Badge>
                }
                title={
                  <div className="chat-item-title">
                    <Text strong ellipsis style={{ maxWidth: 150 }}>
                      {getChatName(chat)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {chat.lastMessage && dayjs(chat.lastMessage.createdAt).format('HH:mm')}
                    </Text>
                  </div>
                }
                description={
                  <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
                    {chat.lastMessage?.content || '暂无消息'}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </Sider>

      <Content className="chat-content">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <Avatar
                  src={getChatAvatar(selectedChat)}
                  icon={selectedChat.type === 'GROUP' ? <TeamOutlined /> : <UserOutlined />}
                  size="large"
                />
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {getChatName(selectedChat)}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedChat.members.length} 人
                  </Text>
                </div>
              </div>
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item key="info">聊天信息</Menu.Item>
                    <Menu.Item key="clear">清空记录</Menu.Item>
                  </Menu>
                }
              >
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item ${msg.senderId === user?.id ? 'own' : 'other'}`}
                >
                  {msg.senderId !== user?.id && (
                    <Avatar
                      src={msg.sender?.avatar}
                      icon={<UserOutlined />}
                      size="small"
                    />
                  )}
                  <div className="message-content">
                    {msg.senderId !== user?.id && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {msg.sender?.realName}
                      </Text>
                    )}
                    <div className="message-bubble">
                      {msg.isRecalled ? (
                        <Text type="secondary" style={{ fontStyle: 'italic' }}>
                          消息已撤回
                        </Text>
                      ) : (
                        <Text>{msg.content}</Text>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(msg.createdAt).format('HH:mm')}
                    </Text>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <Input.TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="输入消息..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
              >
                发送
              </Button>
            </div>
          </>
        ) : (
          <Empty
            description="选择一个聊天开始对话"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 200 }}
          />
        )}
      </Content>
    </Layout>
  );
};

export default ChatPage;
