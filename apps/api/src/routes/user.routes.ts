import { Router } from 'express';
import { body, query } from 'express-validator';
import { UserService } from '../services/user.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// 获取用户列表（需要管理员权限）
router.get(
  '/',
  authenticate,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('keyword').optional().isString(),
    query('departmentId').optional().isUUID(),
  ],
  async (req, res) => {
    try {
      const result = await UserService.getUsers(req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取用户详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    return success(res, user);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建用户（需要管理员权限）
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('username').isLength({ min: 3, max: 20 }),
    body('password').isLength({ min: 6 }),
    body('realName').notEmpty(),
  ],
  async (req, res) => {
    try {
      const user = await UserService.createUser(req.body);
      return success(res, user, '用户创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 更新用户（需要管理员权限）
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    return success(res, user, '用户更新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 删除用户（需要管理员权限）
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await UserService.deleteUser(req.params.id);
    return success(res, null, '用户删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 重置密码（需要管理员权限）
router.post(
  '/:id/reset-password',
  authenticate,
  requireAdmin,
  [body('newPassword').isLength({ min: 6 })],
  async (req, res) => {
    try {
      await UserService.resetPassword(req.params.id, req.body.newPassword);
      return success(res, null, '密码重置成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取通讯录列表
router.get('/contacts/list', authenticate, async (req, res) => {
  try {
    const result = await UserService.getContacts(req.query as any);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取组织架构树
router.get('/departments/tree', authenticate, async (req, res) => {
  try {
    const tree = await UserService.getDepartmentTree();
    return success(res, tree);
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;
