import { Router } from 'express';
import { body, query } from 'express-validator';
import { AnnouncementService } from '../services/announcement.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// 获取公告列表
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('keyword').optional().isString(),
    query('categoryId').optional().isUUID(),
    query('isPublished').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const result = await AnnouncementService.getAnnouncements(
        req.query as any,
        req.user?.userId
      );
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取公告详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await AnnouncementService.getAnnouncementById(
      req.params.id,
      req.user?.userId
    );
    return success(res, announcement);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建公告（需要管理员权限）
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty(),
    body('content').notEmpty(),
    body('categoryId').isUUID(),
  ],
  async (req, res) => {
    try {
      const announcement = await AnnouncementService.createAnnouncement(
        req.body,
        req.user!.userId
      );
      return success(res, announcement, '公告创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 更新公告（需要管理员权限）
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const announcement = await AnnouncementService.updateAnnouncement(req.params.id, req.body);
    return success(res, announcement, '公告更新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 删除公告（需要管理员权限）
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await AnnouncementService.deleteAnnouncement(req.params.id);
    return success(res, null, '公告删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取公告分类列表
router.get('/categories/list', authenticate, async (req, res) => {
  try {
    const categories = await AnnouncementService.getCategories();
    return success(res, categories);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建公告分类（需要管理员权限）
router.post(
  '/categories',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty(),
    body('code').notEmpty(),
  ],
  async (req, res) => {
    try {
      const category = await AnnouncementService.createCategory(req.body);
      return success(res, category, '分类创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 更新公告分类（需要管理员权限）
router.put('/categories/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const category = await AnnouncementService.updateCategory(req.params.id, req.body);
    return success(res, category, '分类更新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 删除公告分类（需要管理员权限）
router.delete('/categories/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await AnnouncementService.deleteCategory(req.params.id);
    return success(res, null, '分类删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取未读公告数
router.get('/stats/unread', authenticate, async (req, res) => {
  try {
    const count = await AnnouncementService.getUnreadCount(req.user!.userId);
    return success(res, { count });
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;
