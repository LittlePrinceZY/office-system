import { prisma } from '../utils/prisma';

export class ChatService {
  // 获取用户的聊天列表
  static async getChatList(userId: string) {
    const chatMembers = await prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    realName: true,
                    avatar: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        chat: {
          messages: {
            _count: 'desc',
          },
        },
      },
    });

    return chatMembers.map(member => {
      const chat = member.chat;
      const otherMember = chat.type === 'PRIVATE' 
        ? chat.members.find(m => m.userId !== userId)?.user 
        : null;

      // 计算未读消息数
      const unreadCount = chat.messages.filter(
        m => m.senderId !== userId && (!member.lastReadAt || m.createdAt > member.lastReadAt)
      ).length;

      return {
        id: chat.id,
        type: chat.type,
        name: chat.type === 'PRIVATE' ? otherMember?.realName : chat.name,
        avatar: chat.type === 'PRIVATE' ? otherMember?.avatar : chat.avatar,
        members: chat.members.map(m => ({
          id: m.userId,
          role: m.role,
          user: m.user,
        })),
        lastMessage: chat.messages[0] || null,
        unreadCount,
        updatedAt: chat.updatedAt,
      };
    });
  }

  // 获取聊天详情
  static async getChatDetail(chatId: string, userId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new Error('聊天不存在');
    }

    // 检查用户是否在聊天中
    const isMember = chat.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new Error('无权访问该聊天');
    }

    const otherMember = chat.type === 'PRIVATE' 
      ? chat.members.find(m => m.userId !== userId)?.user 
      : null;

    return {
      id: chat.id,
      type: chat.type,
      name: chat.type === 'PRIVATE' ? otherMember?.realName : chat.name,
      avatar: chat.type === 'PRIVATE' ? otherMember?.avatar : chat.avatar,
      members: chat.members.map(m => ({
        id: m.userId,
        role: m.role,
        user: m.user,
      })),
      createdAt: chat.createdAt,
    };
  }

  // 获取聊天消息
  static async getMessages(chatId: string, userId: string, params: { page?: number; pageSize?: number; before?: Date }) {
    const { page = 1, pageSize = 20, before } = params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!chat || chat.members.length === 0) {
      throw new Error('聊天不存在或无权限访问');
    }

    const where: any = { chatId };
    if (before) {
      where.createdAt = { lt: before };
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.message.count({ where }),
    ]);

    // 更新最后阅读时间
    await prisma.chatMember.updateMany({
      where: { chatId, userId },
      data: { lastReadAt: new Date() },
    });

    return {
      list: messages.reverse(),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 创建私聊
  static async createPrivateChat(userId: string, targetUserId: string) {
    // 检查是否已存在私聊
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: 'PRIVATE',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // 创建新私聊
    const chat = await prisma.chat.create({
      data: {
        type: 'PRIVATE',
        createdBy: userId,
        members: {
          create: [
            { userId, role: 'OWNER' },
            { userId: targetUserId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return chat;
  }

  // 创建群聊
  static async createGroupChat(userId: string, name: string, memberIds: string[]) {
    const uniqueMemberIds = [...new Set([userId, ...memberIds])];

    const chat = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name,
        createdBy: userId,
        members: {
          create: uniqueMemberIds.map((id, index) => ({
            userId: id,
            role: id === userId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // 发送系统消息
    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        type: 'SYSTEM',
        content: `${chat.members.find(m => m.userId === userId)?.user.realName} 创建了群聊`,
      },
    });

    return chat;
  }

  // 发送消息
  static async sendMessage(chatId: string, senderId: string, data: {
    type: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mentions?: string[];
    replyToId?: string;
  }) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { userId: senderId },
        },
      },
    });

    if (!chat || chat.members.length === 0) {
      throw new Error('聊天不存在或无权限发送消息');
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        type: data.type as any,
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mentions: data.mentions || [],
        replyToId: data.replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });

    // 更新聊天更新时间
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // 撤回消息
  static async recallMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!message) {
      throw new Error('消息不存在');
    }

    if (message.senderId !== userId) {
      throw new Error('只能撤回自己的消息');
    }

    // 检查是否在2分钟内
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (message.createdAt < twoMinutesAgo) {
      throw new Error('消息发送超过2分钟，无法撤回');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isRecalled: true },
    });

    return true;
  }

  // 添加群成员
  static async addGroupMembers(chatId: string, operatorId: string, memberIds: string[]) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { userId: operatorId },
        },
      },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('群聊不存在');
    }

    if (chat.members.length === 0 || !['OWNER', 'ADMIN'].includes(chat.members[0].role)) {
      throw new Error('无权添加群成员');
    }

    // 过滤已存在的成员
    const existingMembers = await prisma.chatMember.findMany({
      where: { chatId, userId: { in: memberIds } },
    });
    const existingIds = existingMembers.map(m => m.userId);
    const newMemberIds = memberIds.filter(id => !existingIds.includes(id));

    if (newMemberIds.length === 0) {
      throw new Error('所选用户已在群聊中');
    }

    await prisma.chatMember.createMany({
      data: newMemberIds.map(userId => ({
        chatId,
        userId,
        role: 'MEMBER',
      })),
    });

    // 发送系统消息
    const newMembers = await prisma.user.findMany({
      where: { id: { in: newMemberIds } },
      select: { realName: true },
    });

    await prisma.message.create({
      data: {
        chatId,
        senderId: operatorId,
        type: 'SYSTEM',
        content: `${newMembers.map(m => m.realName).join('、')} 加入了群聊`,
      },
    });

    return true;
  }

  // 移除群成员
  static async removeGroupMember(chatId: string, operatorId: string, memberId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          where: { userId: operatorId },
        },
      },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('群聊不存在');
    }

    const operator = chat.members[0];
    if (!operator || (operator.role !== 'OWNER' && (operator.role !== 'ADMIN' || memberId === operatorId))) {
      throw new Error('无权移除该成员');
    }

    await prisma.chatMember.deleteMany({
      where: { chatId, userId: memberId },
    });

    return true;
  }
}
