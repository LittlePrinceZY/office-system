import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Modal,
  Form,
  Select,
  Upload,
  Space,
  Tooltip,
  Popover,
  Divider,
  Tabs,
  Card,
  Tag,
  Drawer,
  Descriptions,
  Image,
  Popconfirm,
  notification,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  MoreOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
  PaperClipOutlined,
  SmileOutlined,
  PictureOutlined,
  FileOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  SettingOutlined,
  UserAddOutlined,
  ExportOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  HistoryOutlined,
  InfoCircleOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraAddOutlined,
  WechatOutlined,
  AtOutlined,
  RobotOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';
import request from '@/utils/request';
import dayjs from 'dayjs';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import './style.css';

const { Sider, Content } = Layout;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Chat {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  name: string;
  avatar?: string;
  description?: string;
  members: Member[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: ChatSettings;
}

interface Member {
  id: string;
  realName: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO' | 'SYSTEM';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
  sender: {
    id: string;
    realName: string;
    avatar?: string;
  };
  isRecalled?: boolean;
  isEdited?: boolean;
  reactions?: Reaction[];
  readBy?: string[];
}

interface Reaction {
  emoji: string;
  users: string[];
}

interface ChatSettings {
  allowSendMessage: boolean;
  allowSendMedia: boolean;
  allowMentionAll: boolean;
  allowInvite: boolean;
  notification: 'all' | 'mention' | 'none';
}

interface UserStatus {
  id: string;
  isOnline: boolean;
  lastSeen: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

const EnhancedChatPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [users, setUsers] = useState<Member[]>([]);
  const [userStatus, setUserStatus] = useState<Record<string, UserStatus>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>();
  const [activeTab, setActiveTab] = useState('chats');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<any>(null);

  // 初始化数据
  useEffect(() => {
    fetchChats();
    fetchUsers();
    initSocket();

    return () => {
      socketRef.current?.disconnect();
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      socketRef.current?.emit('join_chat', selectedChat.id);
      markAsRead(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchText) {
      const filtered = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
        chat.members.some(member => 
          member.realName.toLowerCase().includes(searchText.toLowerCase())
        )
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [chats, searchText]);

  const initSocket = () => {
    const socket = io(import.meta.env.VITE_WS_URL || '', {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('authenticate', token);
    });

    socket.on('new_message', (data: { chatId: string; message: Message }) => {
      if (data.chatId === selectedChat?.id) {
        setMessages(prev => [...prev, data.message]);
      }
      updateChatLastMessage(data.chatId, data.message);
    });

    socket.on('message_edited', (data: { chatId: string; messageId: string; content: string }) => {
      if (data.chatId === selectedChat?.id) {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId ? { ...msg, content: data.content, isEdited: true } : msg
        ));
      }
    });

    socket.on('message_recalled', (data: { chatId: string; messageId: string }) => {
      if (data.chatId === selectedChat?.id) {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId ? { ...msg, isRecalled: true } : msg
        ));
      }
    });

    socket.on('user_typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      if (data.chatId === selectedChat?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    });

    socket.on('user_status', (data: UserStatus) => {
      setUserStatus(prev => ({ ...prev, [data.id]: data }));
    });

    socket.on('chat_updated', (data: Chat) => {
      setChats(prev => prev.map(chat => chat.id === data.id ? data : chat));
      if (selectedChat?.id === data.id) {
        setSelectedChat(data);
      }
    });

    socket.on('member_joined', (data: { chatId: string; member: Member }) => {
      if (selectedChat?.id === data.chatId) {
        setSelectedChat(prev => prev ? {
          ...prev,
          members: [...prev.members, data.member]
        } : null);
      }
    });

    socket.on('member_left', (data: { chatId: string; userId: string }) => {
      if (selectedChat?.id === data.chatId) {
        setSelectedChat(prev => prev ? {
          ...prev,
          members: prev.members.filter(m => m.id !== data.userId)
        } : null);
      }
    });

    socketRef.current = socket;
  };

  const fetchChats = async () => {
    try {
      const data = await request.get('/chat/chats');
      setChats(data);
      setFilteredChats(data);
    } catch (error) {
      console.error('获取聊天列表失败:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setLoading(true);
    try {
      const data = await request.get(`/chat/chats/${chatId}/messages`, {
        params: { limit: 50, offset: 0 }
      });
      setMessages(data.list || []);
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await request.get('/users/online');
      const statusMap: Record<string, UserStatus> = {};
      data.forEach((user: any) => {
        statusMap[user.id] = {
          id: user.id,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          status: user.status,
        };
      });
      setUserStatus(statusMap);
    } catch (error) {
      console.error('获取用户状态失败:', error);
    }
  };

  const updateChatLastMessage = (chatId: string, message: Message) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: message,
          unreadCount: chat.id === selectedChat?.id ? 0 : chat.unreadCount + 1,
          updatedAt: message.createdAt,
        };
      }
      return chat;
    }));
  };

  const markAsRead = async (chatId: string) => {
    try {
      await request.post(`/chat/chats/${chatId}/read`);
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (error) {
      console.error('标记已读失败:', error);
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
      setShowEmojiPicker(false);
      setIsTyping(false);
      socketRef.current?.emit('typing', {
        chatId: selectedChat.id,
        isTyping: false,
      });
    } catch (error) {
      message.error('发送失败');
    }
  };

  const handleTyping = useCallback(() => {
    if (!selectedChat || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', {
        chatId: selectedChat.id,
        isTyping: true,
      });
    }

    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing', {
        chatId: selectedChat.id,
        isTyping: false,
      });
    }, 3000);
    setTypingTimeout(timeout);
  }, [selectedChat, user, isTyping, typingTimeout]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    handleTyping();
  };

  const handleEmojiSelect = (emoji: any) => {
    setInputMessage(prev => prev + emoji.native);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCreateGroup = async (values: any) => {
    try {
      const chat = await request.post('/chat/chats/group', {
        name: values.name,
        description: values.description,
        memberIds: values.memberIds,
        avatar: values.avatar,
      });
      setChats(prev => [chat, ...prev]);
      setSelectedChat(chat);
      setShowCreateGroup(false);
      message.success('群聊创建成功');
    } catch (error) {
      message.error('创建群聊失败');
    }
  };

  const handlePinChat = async (chatId: string, isPinned: boolean) => {
    try {
      await request.put(`/chat/chats/${chatId}/pin`, { isPinned });
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, isPinned } : chat
      ));
      message.success(isPinned ? '已置顶' : '已取消置顶');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMuteChat = async (chatId: string, isMuted: boolean) => {
    try {
      await request.put(`/chat/chats/${chatId}/mute`, { isMuted });
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, isMuted } : chat
      ));
      message.success(isMuted ? '已静音' : '已取消静音');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!selectedChat) return;

    try {
      await request.put(`/chat/chats/${selectedChat.id}/messages/${messageId}`, {
        content: newContent,
      });
      socketRef.current?.emit('edit_message', {
        chatId: selectedChat.id,
        messageId,
        content: newContent,
      });
      message.success('消息已编辑');
    } catch (error) {
      message.error('编辑失败');
    }
  };

  const handleRecallMessage = async (messageId: string) => {
    if (!selectedChat) return;

    try {
      await request.delete(`/chat/chats/${selectedChat.id}/messages/${messageId}`);
      socketRef.current?.emit('recall_message', {
        chatId: selectedChat.id,
        messageId,
      });
      message.success('消息已撤回');
    } catch (error) {
      message.error('撤回失败');
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!selectedChat) return;

    try {
      await request.post(`/chat/chats/${selectedChat.id}/messages/${messageId}/reactions`, {
        emoji,
      });
      // 更新本地消息状态
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const existingIndex = reactions.findIndex(r => r.emoji === emoji);
          if (existingIndex >= 0) {
            // 如果已经反应过，取消反应
            const updatedReactions = [...reactions];
            updatedReactions[existingIndex] = {
              ...updatedReactions[existingIndex],
              users: updatedReactions[existingIndex].users.filter(id => id !== user?.id),
            };
            return {
              ...msg,
              reactions: updatedReactions.filter(r => r.users.length > 0),
            };
          } else {
            // 添加新反应
            return {
              ...msg,
              reactions: [...reactions, { emoji, users: [user?.id || ''] }],
            };
          }
        }
        return msg;
      }));
    } catch (error) {
      console.error('添加反应失败:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChat) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type.startsWith('image/') ? 'IMAGE' : 'FILE');

    try {
      const message = await request.post(`/chat/chats/${selectedChat.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      socketRef.current?.emit('send_message', {
        chatId: selectedChat.id,
        message,
      });

      setShowFileUpload(false);
      message.success('文件发送成功');
    } catch (error) {
      message.error('文件发送失败');
    }
  };

  const handleInviteMembers = async (memberIds: string[]) => {
    if (!selectedChat) return;

    try {
      await request.post(`/chat/chats/${selectedChat.id}/members`, { memberIds });
      message.success('邀请成员成功');
      setShowMembers(false);
      // 重新获取聊天信息
      const chat = await request.get(`/chat/chats/${selectedChat.id}`);
      setSelectedChat(chat);
    } catch (error) {
      message.error('邀请成员失败');
    }
  };

  const handleLeaveChat = async () => {
    if (!selectedChat) return;

    Modal.confirm({
      title: selectedChat.type === 'GROUP' ? '退出群聊' : '删除对话',
      content: selectedChat.type === 'GROUP' 
        ? '确定要退出这个群聊吗？退出后将无法接收群消息。'
        : '确定要删除这个对话吗？删除后将无法恢复。',
      onOk: async () => {
        try {
          if (selectedChat.type === 'GROUP') {
            await request.delete(`/chat/chats/${selectedChat.id}/members/me`);
          } else {
            await request.delete(`/chat/chats/${selectedChat.id}`);
          }
          setChats(prev => prev.filter(chat => chat.id !== selectedChat.id));
          setSelectedChat(null);
          message.success(selectedChat.type === 'GROUP' ? '已退出群聊' : '已删除对话');
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.avatar) return chat.avatar;
    return undefined;
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'GROUP') return `群聊(${chat.members.length})`;
    // 对于私聊，显示对方的名字
    const otherMember = chat.members.find(m => m.id !== user?.id);
    return otherMember?.realName || '未知用户';
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      const user = selectedChat?.members.find(m => m.id === typingUsers[0]);
      return `${user?.realName || '有人'}正在输入...`;
    }
    return `${typingUsers.length}人正在输入...`;
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.isRecalled) {
      return (
        <div className="message-bubble recalled">
          <Text type="secondary" italic>
            消息已撤回
          </Text>
        </div>
      );
    }

    switch (msg.type) {
      case 'IMAGE':
        return (
          <div className="message-bubble image">
            <Image
              src={msg.content}
              alt="图片"
              width={200}
              height={200}
              style={{ maxWidth: '100%', borderRadius: '8px' }}
              preview={{
                mask: <EyeOutlined />,
              }}
            />
          </div>
        );
      case 'FILE':
        return (
          <div className="message-bubble file">
            <FileOutlined style={{ marginRight: 8 }} />
            <a href={msg.content} target="_blank" rel="noopener noreferrer">
              {msg.metadata?.fileName || '文件'}
            </a>
            {msg.metadata?.fileSize && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                ({formatFileSize(msg.metadata.fileSize)})
              </Text>
            )}
          </div>
        );
      case 'VOICE':
        return (
          <div className="message-bubble voice">
            <AudioOutlined style={{ marginRight: 8 }} />
            <Text>语音消息</Text>
            {msg.metadata?.duration && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {msg.metadata.duration}s
              </Text>
            )}
          </div>
        );
      case 'VIDEO':
        return (
          <div className="message-bubble video">
            <VideoCameraOutlined style={{ marginRight: 8 }} />
            <Text>视频消息</Text>
          </div>
        );
      case 'SYSTEM':
        return (
          <div className="message-bubble system">
            <Text type="secondary">{msg.content}</Text>
          </div>
        );
      default:
        return (
          <div className="message-bubble text">
            <Text>{msg.content}</Text>
            {msg.isEdited && (
              <Text type="secondary" italic style={{ fontSize: 12, marginLeft: 8 }}>
                (已编辑)
              </Text>
            )}
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderReactions = (msg: Message) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;

    return (
      <Space size={4} className="message-reactions">
        {msg.reactions.map((reaction, index) => (
          <Tooltip
            key={index}
            title={reaction.users.map(userId => {
              const member = selectedChat?.members.find(m => m.id === userId);
              return member?.realName || '未知用户';
            }).join(', ')}
          >
            <Button
              size="small"
              type="text"
              onClick={() => handleAddReaction(msg.id, reaction.emoji)}
              className={reaction.users.includes(user?.id || '') ? 'reaction-active' : ''}
            >
              {reaction.emoji} {reaction.users.length > 1 && reaction.users.length}
            </Button>
          </Tooltip>
        ))}
      </Space>
    );
  };

  return (
    <Layout className="enhanced-chat-layout">
      {/* 侧边栏 */}
      <Sider width={320} className="chat-sider">
        <div className="chat-sider-header">
          <Title level={4} style={{ margin: 0 }}>
            <WechatOutlined style={{ marginRight: 8 }} />
            消息
          </Title>
          <Space>
            <Tooltip title="新建聊天">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => setShowCreateGroup(true)}
              />
            </Tooltip>
            <Tooltip title="设置">
              <Button
                type="text"
                icon={<SettingOutlined />}
                size="small"
                onClick={() => setShowSettings(true)}
              />
            </Tooltip>
          </Space>
        </div>

        <div className="chat-search">
          <Input.Search
            placeholder="搜索聊天、联系人"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="chat-tabs"
        >
          <TabPane tab="聊天" key="chats">
            <List
              className="chat-list"
              dataSource={filteredChats}
              renderItem={(chat) => (
                <List.Item
                  className={`chat-list-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                  actions={[
                    <Tooltip key="pin" title={chat.isPinned ? '取消置顶' : '置顶'}>
                      <Button
                        type="text"
                        size="small"
                        icon={chat.isPinned ? <StarFilled /> : <StarOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinChat(chat.id, !chat.isPinned);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip key="mute" title={chat.isMuted ? '取消静音' : '静音'}>
                      <Button
                        type="text"
                        size="small"
                        icon={chat.isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMuteChat(chat.id, !chat.isMuted);
                        }}
                      />
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge
                        count={chat.unreadCount}
                        size="small"
                        offset={[-5, 5]}
                      >
                        <Badge
                          dot={chat.members.some(m => 
                            m.id !== user?.id && userStatus[m.id]?.isOnline
                          )}
                          offset={[-2, 30]}
                          color="green"
                        >
                          <Avatar
                            src={getChatAvatar(chat)}
                            icon={chat.type === 'GROUP' ? <TeamOutlined /> : <UserOutlined />}
                            size="large"
                            shape={chat.type === 'GROUP' ? 'square' : 'circle'}
                          />
                        </Badge>
                      </Badge>
                    }
                    title={
                      <div className="chat-item-title">
                        <Text strong ellipsis style={{ maxWidth: 150 }}>
                          {getChatName(chat)}
                          {chat.isPinned && <StarFilled style={{ color: '#faad14', marginLeft: 4 }} />}
                          {chat.isMuted && <AudioMutedOutlined style={{ color: '#999', marginLeft: 4 }} />}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {chat.lastMessage && dayjs(chat.lastMessage.createdAt).format('HH:mm')}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
                          {chat.lastMessage?.content || '暂无消息'}
                        </Text>
                        {chat.unreadCount > 0 && (
                          <Badge count={chat.unreadCount} size="small" />
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="联系人" key="contacts">
            <List
              className="contact-list"
              dataSource={users}
              renderItem={(userItem) => (
                <List.Item
                  actions={[
                    <Button
                      key="chat"
                      type="link"
                      size="small"
                      onClick={() => {
                        // 创建私聊
                        request.post('/chat/chats/private', { targetUserId: userItem.id })
                          .then(chat => {
                            setSelectedChat(chat);
                            setActiveTab('chats');
                          });
                      }}
                    >
                      发消息
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge
                        dot={userStatus[userItem.id]?.isOnline}
                        offset={[-2, 30]}
                        color="green"
                      >
                        <Avatar
                          src={userItem.avatar}
                          icon={<UserOutlined />}
                          size="large"
                        />
                      </Badge>
                    }
                    title={
                      <Space>
                        <Text strong>{userItem.realName}</Text>
                        <Tag size="small">{userItem.role}</Tag>
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        {userStatus[userItem.id]?.isOnline ? '在线' : 
                         `最后在线: ${dayjs(userStatus[userItem.id]?.lastSeen).fromNow()}`}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Sider>

      {/* 主内容区 */}
      <Content className="chat-content">
        {selectedChat ? (
          <>
            {/* 聊天头部 */}
            <div className="chat-header">
              <div 
                className="chat-header-info"
                onClick={() => setShowChatInfo(true)}
                style={{ cursor: 'pointer' }}
              >
                <Avatar
                  src={getChatAvatar(selectedChat)}
                  icon={selectedChat.type === 'GROUP' ? <TeamOutlined /> : <UserOutlined />}
                  size="large"
                  shape={selectedChat.type === 'GROUP' ? 'square' : 'circle'}
                />
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {getChatName(selectedChat)}
                    {selectedChat.isPinned && <StarFilled style={{ color: '#faad14', marginLeft: 4 }} />}
                    {selectedChat.isMuted && <AudioMutedOutlined style={{ color: '#999', marginLeft: 4 }} />}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedChat.type === 'GROUP' ? (
                      <>
                        {selectedChat.members.length} 人
                        {typingUsers.length > 0 && ` • ${getTypingText()}`}
                      </>
                    ) : (
                      <>
                        {userStatus[selectedChat.members.find(m => m.id !== user?.id)?.id || '']?.isOnline 
                          ? '在线' 
                          : '离线'}
                        {typingUsers.length > 0 && ` • ${getTypingText()}`}
                      </>
                    )}
                  </Text>
                </div>
              </div>
              <Space>
                {selectedChat.type === 'GROUP' && (
                  <Tooltip title="视频会议">
                    <Button
                      type="text"
                      icon={<VideoCameraAddOutlined />}
                      onClick={() => notification.info({ message: '视频会议功能开发中' })}
                    />
                  </Tooltip>
                )}
                <Tooltip title="语音通话">
                  <Button
                    type="text"
                    icon={<PhoneOutlined />}
                    onClick={() => notification.info({ message: '语音通话功能开发中' })}
                  />
                </Tooltip>
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item key="info" icon={<InfoCircleOutlined />} onClick={() => setShowChatInfo(true)}>
                        聊天信息
                      </Menu.Item>
                      {selectedChat.type === 'GROUP' && (
                        <Menu.Item key="members" icon={<UserAddOutlined />} onClick={() => setShowMembers(true)}>
                          管理成员
                        </Menu.Item>
                      )}
                      <Menu.Item key="history" icon={<HistoryOutlined />}>
                        聊天记录
                      </Menu.Item>
                      <Menu.Item key="export" icon={<ExportOutlined />}>
                        导出聊天
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item 
                        key="leave" 
                        icon={<DeleteOutlined />} 
                        danger
                        onClick={handleLeaveChat}
                      >
                        {selectedChat.type === 'GROUP' ? '退出群聊' : '删除对话'}
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
            </div>

            {/* 消息区域 */}
            <div className="chat-messages">
              {loading ? (
                <div className="loading-messages">
                  <Empty description="加载消息中..." />
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-messages">
                  <Empty
                    description="还没有消息，开始聊天吧！"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              ) : (
                <>
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
                          <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
                            {msg.sender?.realName}
                          </Text>
                        )}
                        {renderMessageContent(msg)}
                        {renderReactions(msg)}
                        <div className="message-time">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(msg.createdAt).format('HH:mm')}
                          </Text>
                          {msg.senderId === user?.id && !msg.isRecalled && (
                            <Space size={2} style={{ marginLeft: 8 }}>
                              <Tooltip title="编辑">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    Modal.confirm({
                                      title: '编辑消息',
                                      content: (
                                        <Input.TextArea
                                          defaultValue={msg.content}
                                          onPressEnter={(e) => {
                                            if (!e.shiftKey) {
                                              e.preventDefault();
                                              handleEditMessage(msg.id, e.currentTarget.value);
                                              Modal.destroyAll();
                                            }
                                          }}
                                        />
                                      ),
                                      onOk: (modal) => {
                                        const input = modal.update({
                                          content: (
                                            <Input.TextArea
                                              defaultValue={msg.content}
                                              ref={(ref) => {
                                                if (ref) {
                                                  ref.focus();
                                                  ref.select();
                                                }
                                              }}
                                              onPressEnter={(e) => {
                                                if (!e.shiftKey) {
                                                  e.preventDefault();
                                                  handleEditMessage(msg.id, e.currentTarget.value);
                                                  Modal.destroyAll();
                                                }
                                              }}
                                            />
                                          ),
                                        });
                                      },
                                    });
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="撤回">
                                <Popconfirm
                                  title="确定要撤回这条消息吗？"
                                  onConfirm={() => handleRecallMessage(msg.id)}
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                  />
                                </Popconfirm>
                              </Tooltip>
                            </Space>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* 输入区域 */}
            <div className="chat-input-area">
              <Space className="input-tools" size="middle">
                <Tooltip title="表情">
                  <Button
                    type="text"
                    icon={<SmileOutlined />}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  />
                </Tooltip>
                <Tooltip title="图片">
                  <Button
                    type="text"
                    icon={<PictureOutlined />}
                    onClick={() => fileInputRef.current?.click()}
                  />
                </Tooltip>
                <Tooltip title="文件">
                  <Button
                    type="text"
                    icon={<FileOutlined />}
                    onClick={() => setShowFileUpload(true)}
                  />
                </Tooltip>
                <Tooltip title="@某人">
                  <Button
                    type="text"
                    icon={<AtOutlined />}
                    onClick={() => {
                      setInputMessage(prev => prev + '@');
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                  />
                </Tooltip>
                <Tooltip title="翻译">
                  <Button
                    type="text"
                    icon={<TranslationOutlined />}
                    onClick={() => notification.info({ message: '翻译功能开发中' })}
                  />
                </Tooltip>
              </Space>

              <div className="input-main">
                {showEmojiPicker && (
                  <div className="emoji-picker">
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                    />
                  </div>
                )}
                <TextArea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder="输入消息..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="send-button"
              >
                发送
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                  e.target.value = '';
                }}
              />
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <Empty
              description={
                <div>
                  <Title level={4}>选择一个聊天开始对话</Title>
                  <Paragraph type="secondary">
                    或者创建一个新的群聊，与同事协作交流
                  </Paragraph>
                </div>
              }
              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateGroup(true)}
              >
                新建群聊
              </Button>
            </Empty>
          </div>
        )}
      </Content>

      {/* 创建群聊模态框 */}
      <Modal
        title="新建群聊"
        open={showCreateGroup}
        onCancel={() => setShowCreateGroup(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleCreateGroup} layout="vertical">
          <Form.Item
            name="name"
            label="群聊名称"
            rules={[{ required: true, message: '请输入群聊名称' }]}
          >
            <Input placeholder="请输入群聊名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="群聊描述"
          >
            <Input.TextArea placeholder="请输入群聊描述" rows={3} />
          </Form.Item>
          <Form.Item
            name="memberIds"
            label="选择成员"
            rules={[{ required: true, message: '请至少选择一名成员' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择成员"
              options={users.map(u => ({
                label: u.realName,
                value: u.id,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCreateGroup(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 聊天信息抽屉 */}
      <Drawer
        title="聊天信息"
        placement="right"
        width={400}
        onClose={() => setShowChatInfo(false)}
        open={showChatInfo}
      >
        {selectedChat && (
          <div>
            <div className="chat-info-header" style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                src={getChatAvatar(selectedChat)}
                icon={selectedChat.type === 'GROUP' ? <TeamOutlined /> : <UserOutlined />}
                size={80}
                shape={selectedChat.type === 'GROUP' ? 'square' : 'circle'}
              />
              <Title level={4} style={{ marginTop: 16 }}>
                {getChatName(selectedChat)}
              </Title>
              <Text type="secondary">
                {selectedChat.type === 'GROUP' 
                  ? `${selectedChat.members.length} 名成员`
                  : selectedChat.members.find(m => m.id !== user?.id)?.realName}
              </Text>
            </div>

            {selectedChat.description && (
              <Card size="small" className="mb-3">
                <Paragraph>{selectedChat.description}</Paragraph>
              </Card>
            )}

            <Tabs defaultActiveKey="members">
              <TabPane tab="成员" key="members">
                <List
                  dataSource={selectedChat.members}
                  renderItem={(member) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge
                            dot={userStatus[member.id]?.isOnline}
                            offset={[-2, 30]}
                            color="green"
                          >
                            <Avatar
                              src={member.avatar}
                              icon={<UserOutlined />}
                            />
                          </Badge>
                        }
                        title={
                          <Space>
                            <Text>{member.realName}</Text>
                            {member.role === 'owner' && <Tag color="gold">群主</Tag>}
                            {member.role === 'admin' && <Tag color="blue">管理员</Tag>}
                          </Space>
                        }
                        description={
                          userStatus[member.id]?.isOnline ? '在线' : '离线'
                        }
                      />
                    </List.Item>
                  )}
                />
              </TabPane>
              <TabPane tab="设置" key="settings">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="聊天类型">
                    {selectedChat.type === 'GROUP' ? '群聊' : '私聊'}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {dayjs(selectedChat.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后活跃">
                    {dayjs(selectedChat.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type={selectedChat.isPinned ? 'default' : 'text'}
                    icon={selectedChat.isPinned ? <StarFilled /> : <StarOutlined />}
                    block
                    onClick={() => handlePinChat(selectedChat.id, !selectedChat.isPinned)}
                  >
                    {selectedChat.isPinned ? '取消置顶' : '置顶聊天'}
                  </Button>
                  <Button
                    type={selectedChat.isMuted ? 'default' : 'text'}
                    icon={selectedChat.isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                    block
                    onClick={() => handleMuteChat(selectedChat.id, !selectedChat.isMuted)}
                  >
                    {selectedChat.isMuted ? '取消静音' : '静音通知'}
                  </Button>
                  <Button
                    type="text"
                    icon={<HistoryOutlined />}
                    block
                  >
                    查看聊天记录
                  </Button>
                  <Button
                    type="text"
                    icon={<ExportOutlined />}
                    block
                  >
                    导出聊天记录
                  </Button>
                  <Divider />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    block
                    onClick={handleLeaveChat}
                  >
                    {selectedChat.type === 'GROUP' ? '退出群聊' : '删除对话'}
                  </Button>
                </Space>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>

      {/* 管理成员抽屉 */}
      <Drawer
        title="管理成员"
        placement="right"
        width={400}
        onClose={() => setShowMembers(false)}
        open={showMembers && selectedChat?.type === 'GROUP'}
      >
        {selectedChat && selectedChat.type === 'GROUP' && (
          <div>
            <div className="mb-4">
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                block
                onClick={() => {
                  Modal.confirm({
                    title: '邀请成员',
                    content: (
                      <Form onFinish={(values) => handleInviteMembers(values.memberIds)}>
                        <Form.Item
                          name="memberIds"
                          rules={[{ required: true, message: '请选择要邀请的成员' }]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="请选择成员"
                            options={users
                              .filter(u => !selectedChat.members.find(m => m.id === u.id))
                              .map(u => ({
                                label: u.realName,
                                value: u.id,
                              }))}
                          />
                        </Form.Item>
                      </Form>
                    ),
                    onOk: () => {
                      const form = document.querySelector('form');
                      if (form) {
                        const formData = new FormData(form);
                        // 处理表单提交
                      }
                    },
                  });
                }}
              >
                邀请成员
              </Button>
            </div>
            <List
              dataSource={selectedChat.members}
              renderItem={(member) => (
                <List.Item
                  actions={
                    member.id !== user?.id ? [
                      <Popconfirm
                        key="remove"
                        title="确定要移除此成员吗？"
                        onConfirm={() => {
                          // 移除成员逻辑
                          message.info('移除成员功能开发中');
                        }}
                      >
                        <Button type="text" danger size="small">移除</Button>
                      </Popconfirm>,
                    ] : []
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={member.avatar}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text>{member.realName}</Text>
                        {member.role === 'owner' && <Tag color="gold">群主</Tag>}
                        {member.role === 'admin' && <Tag color="blue">管理员</Tag>}
                        {member.id === user?.id && <Tag color="green">我</Tag>}
                      </Space>
                    }
                    description={
                      userStatus[member.id]?.isOnline ? '在线' : '离线'
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      {/* 文件上传模态框 */}
      <Modal
        title="发送文件"
        open={showFileUpload}
        onCancel={() => setShowFileUpload(false)}
        footer={null}
      >
        <Upload.Dragger
          multiple={false}
          beforeUpload={(file) => {
            handleFileUpload(file);
            return false;
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <FileOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持图片、文档、视频等文件类型
          </p>
        </Upload.Dragger>
      </Modal>

      {/* 设置抽屉 */}
      <Drawer
        title="聊天设置"
        placement="right"
        width={400}
        onClose={() => setShowSettings(false)}
        open={showSettings}
      >
        <Tabs>
          <TabPane tab="通知设置" key="notifications">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="新消息通知">
                    <Select defaultValue="all" size="small" style={{ width: 120 }}>
                      <Select.Option value="all">全部通知</Select.Option>
                      <Select.Option value="mention">仅@我时</Select.Option>
                      <Select.Option value="none">关闭通知</Select.Option>
                    </Select>
                  </Descriptions.Item>
                  <Descriptions.Item label="声音提醒">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="震动提醒">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Space>
          </TabPane>
          <TabPane tab="隐私设置" key="privacy">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="显示在线状态">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="允许陌生人添加">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="消息已读回执">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="消息撤回时间">
                    <Select defaultValue="120" size="small" style={{ width: 120 }}>
                      <Select.Option value="60">1分钟</Select.Option>
                      <Select.Option value="120">2分钟</Select.Option>
                      <Select.Option value="300">5分钟</Select.Option>
                    </Select>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Space>
          </TabPane>
        </Tabs>
      </Drawer>
    </Layout>
  );
};

export default EnhancedChatPage;