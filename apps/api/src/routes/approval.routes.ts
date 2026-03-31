import { Router } from 'express';
import { body, query } from 'express-validator';
import { ApprovalService } from '../services/approval.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ========== 审批模板 ==========

// 获取审批模板列表
router.get(
  '/templates',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('keyword').optional().isString(),
  ],
  async (req, res) => {
    try {
      const result = await ApprovalService.getTemplates(req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取审批模板详情
router.get('/templates/:id', authenticate, async (req, res) => {
  try {
    const template = await ApprovalService.getTemplateById(req.params.id);
    return success(res, template);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建审批模板（需要管理员权限）
router.post(
  '/templates',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty(),
    body('code').notEmpty(),
    body('formSchema').isObject(),
    body('flowConfig').isObject(),
  ],
  async (req, res) => {
    try {
      const template = await ApprovalService.createTemplate(req.body);
      return success(res, template, '模板创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 更新审批模板（需要管理员权限）
router.put('/templates/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const template = await ApprovalService.updateTemplate(req.params.id, req.body);
    return success(res, template, '模板更新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 删除审批模板（需要管理员权限）
router.delete('/templates/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await ApprovalService.deleteTemplate(req.params.id);
    return success(res, null, '模板删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// ========== 审批申请 ==========

// 获取我的审批列表
router.get(
  '/my',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN']),
  ],
  async (req, res) => {
    try {
      const result = await ApprovalService.getMyApprovals(req.user!.userId, req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取待我审批的列表
router.get(
  '/pending',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const result = await ApprovalService.getPendingApprovals(req.user!.userId, req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取我已审批的列表
router.get(
  '/processed',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const result = await ApprovalService.getProcessedApprovals(req.user!.userId, req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取审批详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const approval = await ApprovalService.getApprovalById(req.params.id, req.user!.userId);
    return success(res, approval);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 提交审批申请
router.post(
  '/',
  authenticate,
  [
    body('templateId').isUUID(),
    body('title').notEmpty(),
    body('formData').isObject(),
  ],
  async (req, res) => {
    try {
      const approval = await ApprovalService.createApproval(req.body, req.user!.userId);
      return success(res, approval, '审批申请提交成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 处理审批任务
router.post(
  '/:id/tasks/:taskId',
  authenticate,
  [
    body('action').isIn(['APPROVE', 'REJECT', 'TRANSFER']),
    body('comment').optional().isString(),
  ],
  async (req, res) => {
    try {
      const approval = await ApprovalService.processApproval(
        req.params.id,
        req.params.taskId,
        req.user!.userId,
        req.body
      );
      return success(res, approval, '审批处理成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 撤回审批申请
router.post('/:id/withdraw', authenticate, async (req, res) => {
  try {
    await ApprovalService.withdrawApproval(req.params.id, req.user!.userId);
    return success(res, null, '审批已撤回');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 获取待审批数量
router.get('/stats/pending-count', authenticate, async (req, res) => {
  try {
    const count = await ApprovalService.getPendingCount(req.user!.userId);
    return success(res, { count });
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;
