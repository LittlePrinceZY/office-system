import { prisma } from '../utils/prisma';
import { PaginationParams, PaginatedResponse } from '../types';

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  categoryId: string;
  isTop?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  categoryId?: string;
  isTop?: boolean;
  isPublished?: boolean;
}

export class AnnouncementService {
  // 获取公告列表
  static async getAnnouncements(
    params: PaginationParams & { keyword?: string; categoryId?: string; isPublished?: boolean },
    userId?: string
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, keyword, categoryId, isPublished } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { isTop: 'desc' },
          { publishedAt: 'desc' },
        ],
        include: {
          category: true,
          author: {
            select: {
              id: true,
              realName: true,
              avatar: true,
            },
          },
          _count: {
            select: { reads: true },
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    // 检查当前用户是否已读
    let readAnnouncementIds: string[] = [];
    if (userId) {
      const reads = await prisma.announcementRead.findMany({
        where: {
          userId,
          announcementId: { in: announcements.map(a => a.id) },
        },
        select: { announcementId: true },
      });
      readAnnouncementIds = reads.map(r => r.announcementId);
    }

    const list = announcements.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      isTop: a.isTop,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt,
      author: a.author,
      viewCount: a.viewCount,
      readCount: a._count.reads,
      isRead: readAnnouncementIds.includes(a.id),
      createdAt: a.createdAt,
    }));

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取公告详情
  static async getAnnouncementById(id: string, userId?: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
        _count: {
          select: { reads: true },
        },
      },
    });

    if (!announcement) {
      throw new Error('公告不存在');
    }

    // 增加浏览次数
    await prisma.announcement.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 记录阅读
    let isRead = false;
    if (userId) {
      const existingRead = await prisma.announcementRead.findUnique({
        where: {
          announcementId_userId: {
            announcementId: id,
            userId,
          },
        },
      });

      if (!existingRead) {
        await prisma.announcementRead.create({
          data: {
            announcementId: id,
            userId,
          },
        });
      }
      isRead = true;
    }

    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      isTop: announcement.isTop,
      isPublished: announcement.isPublished,
      publishedAt: announcement.publishedAt,
      author: announcement.author,
      viewCount: announcement.viewCount + 1,
      readCount: announcement._count.reads + (isRead ? 1 : 0),
      isRead,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }

  // 创建公告
  static async createAnnouncement(input: CreateAnnouncementInput, authorId: string) {
    const { title, content, categoryId, isTop } = input;

    // 验证分类是否存在
    const category = await prisma.announcementCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error('公告分类不存在');
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        categoryId,
        isTop: isTop || false,
        isPublished: false,
        authorId,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });

    return announcement;
  }

  // 更新公告
  static async updateAnnouncement(id: string, input: UpdateAnnouncementInput) {
    const { title, content, categoryId, isTop, isPublished } = input;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('公告不存在');
    }

    // 如果分类变更，验证新分类是否存在
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.announcementCategory.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new Error('公告分类不存在');
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isTop !== undefined) updateData.isTop = isTop;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !existing.isPublished) {
        updateData.publishedAt = new Date();
      }
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
        _count: {
          select: { reads: true },
        },
      },
    });

    return {
      ...announcement,
      readCount: announcement._count.reads,
    };
  }

  // 删除公告
  static async deleteAnnouncement(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new Error('公告不存在');
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return true;
  }

  // 获取公告分类列表
  static async getCategories() {
    const categories = await prisma.announcementCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { announcements: true },
        },
      },
    });

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      sortOrder: c.sortOrder,
      announcementCount: c._count.announcements,
    }));
  }

  // 创建公告分类
  static async createCategory(data: { name: string; code: string; sortOrder?: number }) {
    const existing = await prisma.announcementCategory.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('分类编码已存在');
    }

    const category = await prisma.announcementCategory.create({
      data,
    });

    return category;
  }

  // 更新公告分类
  static async updateCategory(id: string, data: { name?: string; sortOrder?: number }) {
    const category = await prisma.announcementCategory.update({
      where: { id },
      data,
    });

    return category;
  }

  // 删除公告分类
  static async deleteCategory(id: string) {
    const category = await prisma.announcementCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { announcements: true },
        },
      },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    if (category._count.announcements > 0) {
      throw new Error('该分类下存在公告，无法删除');
    }

    await prisma.announcementCategory.delete({
      where: { id },
    });

    return true;
  }

  // 获取未读公告数
  static async getUnreadCount(userId: string) {
    const totalPublished = await prisma.announcement.count({
      where: { isPublished: true },
    });

    const readCount = await prisma.announcementRead.count({
      where: { userId },
    });

    return totalPublished - readCount;
  }
}
