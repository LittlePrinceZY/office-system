import { Router } from 'express';
import { body } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { success, error } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();

// 登录
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  async (req, res) => {
    try {
      const result = await AuthService.login(req.body);
      return success(res, result, '登录成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 注册
router.post(
  '/register',
  [
    body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度应为3-20个字符'),
    body('password').isLength({ min: 6 }).withMessage('密码长度至少为6个字符'),
    body('realName').notEmpty().withMessage('真实姓名不能为空'),
  ],
  async (req, res) => {
    try {
      const result = await AuthService.register(req.body);
      return success(res, result, '注册成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 刷新Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return error(res, 'Refresh Token不能为空');
    }
    const result = await AuthService.refreshToken(refreshToken);
    return success(res, result, 'Token刷新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req.user!.userId);
    return success(res, user);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 修改密码
router.post(
  '/change-password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码长度至少为6个字符'),
  ],
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user!.userId, oldPassword, newPassword);
      return success(res, null, '密码修改成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

export default router;
