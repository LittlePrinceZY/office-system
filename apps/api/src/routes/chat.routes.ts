import { Router } from 'express';
import { body } from 'express-validator';
import { ChatService } from '../services/chat.service';
import { success, error } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();

// 获取聊天列表
router.get('/chats', authenticate, async (req, res) => {
  try {
    const chats = await ChatService.getChatList(req.user!.userId);
    return success(res, chats);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取聊天详情
router.get('/chats/:id', authenticate, async (req, res) => {
  try {
    const chat = await ChatService.getChatDetail(req.params.id, req.user!.userId);
    return success(res, chat);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取聊天消息
router.get('/chats/:id/messages', authenticate, async (req, res) => {
  try {
    const { page, pageSize, before } = req.query;
    const messages = await ChatService.getMessages(req.params.id, req.user!.userId, {
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
      before: before ? new Date(before as string) : undefined,
    });
    return success(res, messages);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建私聊
router.post(
  '/chats/private',
  authenticate,
  [body('targetUserId').isUUID()],
  async (req, res) => {
    try {
      const chat = await ChatService.createPrivateChat(req.user!.userId, req.body.targetUserId);
      return success(res, chat, '私聊创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 创建群聊
router.post(
  '/chats/group',
  authenticate,
  [
    body('name').notEmpty(),
    body('memberIds').isArray({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const { name, memberIds } = req.body;
      const chat = await ChatService.createGroupChat(req.user!.userId, name, memberIds);
      return success(res, chat, '群聊创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 发送消息
router.post(
  '/chats/:id/messages',
  authenticate,
  [
    body('type').isIn(['TEXT', 'IMAGE', 'FILE']),
    body('content').notEmpty(),
  ],
  async (req, res) => {
    try {
      const message = await ChatService.sendMessage(req.params.id, req.user!.userId, req.body);
      return success(res, message, '消息发送成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 撤回消息
router.post('/messages/:id/recall', authenticate, async (req, res) => {
  try {
    await ChatService.recallMessage(req.params.id, req.user!.userId);
    return success(res, null, '消息已撤回');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 添加群成员
router.post(
  '/chats/:id/members',
  authenticate,
  [body('memberIds').isArray({ min: 1 })],
  async (req, res) => {
    try {
      await ChatService.addGroupMembers(req.params.id, req.user!.userId, req.body.memberIds);
      return success(res, null, '成员添加成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 移除群成员
router.delete('/chats/:id/members/:memberId', authenticate, async (req, res) => {
  try {
    await ChatService.removeGroupMember(req.params.id, req.user!.userId, req.params.memberId);
    return success(res, null, '成员移除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;
