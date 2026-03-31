import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// 加载环境变量
dotenv.config();

// 导入路由
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import announcementRoutes from './routes/announcement.routes';
import approvalRoutes from './routes/approval.routes';
import financeRoutes from './routes/finance.routes';
import crmRoutes from './routes/crm.routes';
import crmApprovalRoutes from './routes/crm-approval.routes';
import systemRoutes from './routes/system.routes';

// 导入中间件
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { verifyAccessToken } from './utils/jwt';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求
  message: '请求过于频繁，请稍后再试',
});
app.use(limiter);

// 压缩中间件
app.use(compression());

// 请求日志
app.use(requestLogger);

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/crm-approval', crmApprovalRoutes);
app.use('/api/system', systemRoutes);

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 认证
  socket.on('authenticate', (token: string) => {
    const payload = verifyAccessToken(token);
    if (payload) {
      socket.data.userId = payload.userId;
      socket.join(`user:${payload.userId}`);
      console.log('用户认证成功:', payload.userId);
      socket.emit('authenticated', { success: true });
    } else {
      socket.emit('authenticated', { success: false, message: 'Token无效' });
    }
  });

  // 加入聊天室
  socket.on('join_chat', (chatId: string) => {
    if (!socket.data.userId) {
      socket.emit('error', { message: '请先认证' });
      return;
    }
    socket.join(`chat:${chatId}`);
    console.log(`用户 ${socket.data.userId} 加入聊天室 ${chatId}`);
  });

  // 离开聊天室
  socket.on('leave_chat', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
    console.log(`用户 ${socket.data.userId} 离开聊天室 ${chatId}`);
  });

  // 发送消息
  socket.on('send_message', async (data: { chatId: string; message: any }) => {
    if (!socket.data.userId) {
      socket.emit('error', { message: '请先认证' });
      return;
    }

    const { chatId, message } = data;

    // 广播消息到聊天室
    io.to(`chat:${chatId}`).emit('new_message', {
      chatId,
      message: {
        ...message,
        senderId: socket.data.userId,
      },
    });

    // 通知其他成员
    socket.to(`chat:${chatId}`).emit('message_notification', {
      chatId,
      message: {
        ...message,
        senderId: socket.data.userId,
      },
    });
  });

  // 输入中
  socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
    socket.to(`chat:${data.chatId}`).emit('user_typing', {
      chatId: data.chatId,
      userId: socket.data.userId,
      isTyping: data.isTyping,
    });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
httpServer.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📡 环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
