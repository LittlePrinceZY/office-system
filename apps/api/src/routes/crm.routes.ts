import { Router } from 'express';
import { body, query } from 'express-validator';
import { CRMService } from '../services/crm.service';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ========== 客户管理 ==========

// 获取客户列表
router.get(
  '/customers',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('keyword').optional().isString(),
    query('status').optional().isIn(['POTENTIAL', 'FOLLOWING', 'SIGNED', 'LOST']),
    query('ownerId').optional().isUUID(),
  ],
  async (req, res) => {
    try {
      const result = await CRMService.getCustomers(req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取客户详情
router.get('/customers/:id', authenticate, async (req, res) => {
  try {
    const customer = await CRMService.getCustomerById(req.params.id);
    return success(res, customer);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建客户
router.post(
  '/customers',
  authenticate,
  [
    body('name').notEmpty(),
    body('type').isIn(['ENTERPRISE', 'INDIVIDUAL', 'GOVERNMENT']),
  ],
  async (req, res) => {
    try {
      const customer = await CRMService.createCustomer(req.body, req.user!.userId);
      return success(res, customer, '客户创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 更新客户
router.put('/customers/:id', authenticate, async (req, res) => {
  try {
    const customer = await CRMService.updateCustomer(req.params.id, req.body);
    return success(res, customer, '客户更新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 删除客户
router.delete('/customers/:id', authenticate, async (req, res) => {
  try {
    await CRMService.deleteCustomer(req.params.id);
    return success(res, null, '客户删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// ========== 联系人管理 ==========

// 获取联系人列表
router.get(
  '/contacts',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('customerId').optional().isUUID(),
    query('keyword').optional().isString(),
  ],
  async (req, res) => {
    try {
      const result = await CRMService.getContacts(req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 创建联系人
router.post(
  '/contacts',
  authenticate,
  [
    body('customerId').isUUID(),
    body('name').notEmpty(),
  ],
  async (req, res) => {
    try {
      const contact = await CRMService.createContact(req.body, req.user!.userId);
      return success(res, contact, '联系人创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 更新联系人
router.put('/contacts/:id', authenticate, async (req, res) => {
  try {
    const contact = await CRMService.updateContact(req.params.id, req.body);
    return success(res, contact, '联系人更新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 删除联系人
router.delete('/contacts/:id', authenticate, async (req, res) => {
  try {
    await CRMService.deleteContact(req.params.id);
    return success(res, null, '联系人删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// ========== 跟进记录 ==========

// 获取跟进记录列表
router.get(
  '/follow-ups',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('customerId').optional().isUUID(),
    query('createdBy').optional().isUUID(),
  ],
  async (req, res) => {
    try {
      const result = await CRMService.getFollowUps(req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 创建跟进记录
router.post(
  '/follow-ups',
  authenticate,
  [
    body('customerId').isUUID(),
    body('content').notEmpty(),
    body('type').isIn(['PHONE', 'EMAIL', 'VISIT', 'MEETING', 'OTHER']),
  ],
  async (req, res) => {
    try {
      const followUp = await CRMService.createFollowUp(req.body, req.user!.userId);
      return success(res, followUp, '跟进记录创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 删除跟进记录
router.delete('/follow-ups/:id', authenticate, async (req, res) => {
  try {
    await CRMService.deleteFollowUp(req.params.id);
    return success(res, null, '跟进记录删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// ========== 合同管理 ==========

// 获取合同列表
router.get(
  '/contracts',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('customerId').optional().isUUID(),
    query('status').optional().isIn(['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']),
    query('keyword').optional().isString(),
  ],
  async (req, res) => {
    try {
      const result = await CRMService.getContracts(req.query as any);
      return success(res, result);
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 获取合同详情
router.get('/contracts/:id', authenticate, async (req, res) => {
  try {
    const contract = await CRMService.getContractById(req.params.id);
    return success(res, contract);
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 创建合同
router.post(
  '/contracts',
  authenticate,
  [
    body('customerId').isUUID(),
    body('code').notEmpty(),
    body('name').notEmpty(),
    body('amount').isFloat({ min: 0 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  async (req, res) => {
    try {
      const contract = await CRMService.createContract({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      });
      return success(res, contract, '合同创建成功');
    } catch (err: any) {
      return error(res, err.message);
    }
  }
);

// 更新合同
router.put('/contracts/:id', authenticate, async (req, res) => {
  try {
    const data: any = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const contract = await CRMService.updateContract(req.params.id, data);
    return success(res, contract, '合同更新成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// 删除合同
router.delete('/contracts/:id', authenticate, async (req, res) => {
  try {
    await CRMService.deleteContract(req.params.id);
    return success(res, null, '合同删除成功');
  } catch (err: any) {
    return error(res, err.message);
  }
});

// ========== 统计 ==========

// 获取CRM统计
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const stats = await CRMService.getStatistics();
    return success(res, stats);
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;
