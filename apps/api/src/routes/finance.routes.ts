import { Router } from 'express';
import { body, query } from 'express-validator';
import { FinanceService } from '../services/finance.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ========== 报销管理 ==========

// 获取我的报销列表
router.get(
  '/reimbursements/my',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
  ],
  async (req, res) => {
    try {
      const result = await FinanceService.getMyReimbursements(req.user!.userId, req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取待审批报销列表（需要管理员权限）
router.get(
  '/reimbursements/pending',
  authenticate,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const result = await FinanceService.getPendingReimbursements(req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取报销详情
router.get('/reimbursements/:id', authenticate, async (req, res) => {
  try {
    const reimbursement = await FinanceService.getReimbursementById(req.params.id);
    return success(res, reimbursement);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建报销申请
router.post(
  '/reimbursements',
  authenticate,
  [
    body('type').isIn(['TRAVEL', 'MEAL', 'OFFICE', 'ENTERTAINMENT', 'OTHER']),
    body('amount').isFloat({ min: 0.01 }),
    body('date').isISO8601(),
    body('description').notEmpty(),
  ],
  async (req, res) => {
    try {
      const reimbursement = await FinanceService.createReimbursement(
        {
          ...req.body,
          date: new Date(req.body.date),
        },
        req.user!.userId
      );
      return success(res, reimbursement, '报销申请提交成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 审批报销（需要管理员权限）
router.post(
  '/reimbursements/:id/approve',
  authenticate,
  requireAdmin,
  [
    body('status').isIn(['APPROVED', 'REJECTED']),
    body('comment').optional().isString(),
  ],
  async (req, res) => {
    try {
      const reimbursement = await FinanceService.processReimbursement(
        req.params.id,
        req.user!.userId,
        req.body
      );
      return success(res, reimbursement, '报销审批完成');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 标记已付款（需要管理员权限）
router.post('/reimbursements/:id/pay', authenticate, requireAdmin, async (req, res) => {
  try {
    const reimbursement = await FinanceService.markAsPaid(req.params.id);
    return success(res, reimbursement, '已标记为已付款');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// ========== 统计报表 ==========

// 获取报销统计
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const stats = await FinanceService.getStatistics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      userId: userId as string,
    });
    return success(res, stats);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取月度统计
router.get('/statistics/monthly', authenticate, async (req, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const userId = req.query.userId as string | undefined;
    const stats = await FinanceService.getMonthlyStatistics(year, userId);
    return success(res, stats);
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;
