import { Router } from 'express';
import { body } from 'express-validator';
import { SystemService } from '../services/system.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// 获取系统配置
router.get('/configs', authenticate, async (req, res) => {
  try {
    const configs = await SystemService.getConfigs();
    return success(res, configs);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 更新系统配置（需要管理员权限）
router.put(
  '/configs',
  authenticate,
  requireAdmin,
  [body().isObject()],
  async (req, res) => {
    try {
      const configs = await SystemService.updateConfigs(req.body, req.user!.userId);
      return success(res, configs, '配置更新成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取系统名称（公开接口）
router.get('/name', async (req, res) => {
  try {
    const name = await SystemService.getSystemName();
    return success(res, { name });
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取仪表盘统计
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const stats = await SystemService.getDashboardStats(req.user!.userId);
    return success(res, stats);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取待办事项
router.get('/todos', authenticate, async (req, res) => {
  try {
    const todos = await SystemService.getTodos(req.user!.userId);
    return success(res, todos);
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;
