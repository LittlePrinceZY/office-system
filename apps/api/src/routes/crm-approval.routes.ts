import { Router } from 'express';
import { body, param } from 'express-validator';
import { CRMApprovalService } from '../services/crm-approval.service';
import { success, error } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();

// 为合同创建审批流程
router.post(
  '/contracts/:contractId/approval',
  authenticate,
  [
    param('contractId').isUUID(),
  ],
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user!.userId;

      const approvalInstance = await CRMApprovalService.createContractApproval(
        contractId,
        req.body.contractName || '',
        req.body.amount || 0,
        userId
      );

      return success(res, approvalInstance, '审批流程创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取合同审批状态
router.get(
  '/contracts/:contractId/approval',
  authenticate,
  [
    param('contractId').isUUID(),
  ],
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const approvalStatus = await CRMApprovalService.getContractApprovalStatus(contractId);

      if (!approvalStatus) {
        return success(res, null, '未找到审批流程');
      }

      return success(res, approvalStatus);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 处理合同审批结果（由审批系统回调）
router.post(
  '/contracts/approval/:instanceId/result',
  authenticate,
  [
    param('instanceId').isUUID(),
    body('status').isIn(['APPROVED', 'REJECTED']),
  ],
  async (req, res) => {
    try {
      const { instanceId } = req.params;
      const { status, comment } = req.body;

      const result = await CRMApprovalService.handleContractApprovalResult(
        instanceId,
        status,
        comment
      );

      return success(res, result, `合同审批${status === 'APPROVED' ? '通过' : '驳回'}`);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 取消合同审批流程
router.post(
  '/contracts/:contractId/approval/cancel',
  authenticate,
  [
    param('contractId').isUUID(),
  ],
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user!.userId;

      await CRMApprovalService.cancelContractApproval(contractId, userId);

      return success(res, null, '审批流程已取消');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

export default router;