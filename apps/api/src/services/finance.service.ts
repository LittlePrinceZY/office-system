import { prisma } from '../utils/prisma';
import { PaginationParams, PaginatedResponse } from '../types';
import { ApprovalService } from './approval.service';

export interface CreateReimbursementInput {
  type: string;
  amount: number;
  date: Date;
  description: string;
  attachments?: string[];
}

export interface ProcessReimbursementInput {
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export class FinanceService {
  // 创建报销申请
  static async createReimbursement(input: CreateReimbursementInput, applicantId: string) {
    const { type, amount, date, description, attachments } = input;

    // 创建报销记录
    const reimbursement = await prisma.reimbursement.create({
      data: {
        applicantId,
        type: type as any,
        amount,
        date,
        description,
        attachments: attachments || [],
        status: 'PENDING',
      },
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
            avatar: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
    });

    try {
      // 尝试创建审批流程
      await this.createApprovalForReimbursement(reimbursement);
    } catch (error) {
      console.error('创建审批流程失败:', error);
      // 不抛出错误，继续返回报销记录
    }

    return reimbursement;
  }

  // 为报销创建审批流程
  private static async createApprovalForReimbursement(reimbursement: any) {
    // 查找报销审批模板
    const templateCode = 'REIMBURSEMENT';
    let template = await prisma.approvalTemplate.findUnique({
      where: { code: templateCode },
    });

    // 如果模板不存在，创建默认报销审批模板
    if (!template) {
      template = await prisma.approvalTemplate.create({
        data: {
          name: '报销审批',
          code: templateCode,
          icon: 'dollar',
          description: '报销申请审批流程',
          formSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', title: '报销类型' },
              amount: { type: 'number', title: '金额' },
              date: { type: 'string', title: '日期', format: 'date' },
              description: { type: 'string', title: '说明' },
            },
            required: ['type', 'amount', 'date', 'description'],
          },
          flowConfig: {
            nodes: [
              { id: 'start', type: 'start', next: 'direct_manager' },
              { 
                id: 'direct_manager', 
                type: 'approval', 
                name: '直接上级审批',
                approver: 'direct_manager',
                next: 'finance_approval'
              },
              { 
                id: 'finance_approval', 
                type: 'approval', 
                name: '财务审批',
                approver: 'finance',
                next: 'end'
              },
              { id: 'end', type: 'end' }
            ]
          },
          isActive: true,
        },
      });
    }

    // 准备表单数据
    const formData = {
      type: this.getTypeLabel(reimbursement.type),
      amount: reimbursement.amount,
      date: new Date(reimbursement.date).toISOString().split('T')[0],
      description: reimbursement.description,
      attachments: reimbursement.attachments,
    };

    // 创建审批实例
    const approval = await prisma.approval.create({
      data: {
        templateId: template.id,
        applicantId: reimbursement.applicantId,
        title: `${this.getTypeLabel(reimbursement.type)}报销申请 - ¥${reimbursement.amount.toFixed(2)}`,
        formData: formData as any,
        status: 'PENDING',
        currentNode: 'direct_manager',
      },
    });

    // 创建审批任务
    const directManagerTask = await prisma.approvalTask.create({
      data: {
        approvalId: approval.id,
        approverId: await this.getDirectManagerId(reimbursement.applicantId),
        nodeName: '直接上级审批',
        action: null,
        comment: null,
      },
    });

    return approval;
  }

  // 获取报销类型标签
  private static getTypeLabel(type: string): string {
    const types: Record<string, string> = {
      TRAVEL: '差旅费',
      MEAL: '餐费',
      OFFICE: '办公费',
      ENTERTAINMENT: '招待费',
      OTHER: '其他',
    };
    return types[type] || type;
  }

  // 获取直接上级ID（简化版，实际项目中需要从组织结构获取）
  private static async getDirectManagerId(userId: string): Promise<string> {
    // 这里应该根据组织结构获取直接上级
    // 暂时返回管理员ID作为示例
    const admin = await prisma.user.findFirst({
      where: { isAdmin: true },
      select: { id: true },
    });
    
    return admin?.id || userId;
  }

  // 获取我的报销列表
  static async getMyReimbursements(
    applicantId: string,
    params: PaginationParams & { status?: string; startDate?: Date; endDate?: Date }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, status, startDate, endDate } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { applicantId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [reimbursements, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          applicant: {
            select: {
              id: true,
              realName: true,
              avatar: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.reimbursement.count({ where }),
    ]);

    return {
      list: reimbursements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取待审批报销列表
  static async getPendingReimbursements(
    params: PaginationParams & { startDate?: Date; endDate?: Date }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, startDate, endDate } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { status: 'PENDING' };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [reimbursements, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          applicant: {
            select: {
              id: true,
              realName: true,
              avatar: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.reimbursement.count({ where }),
    ]);

    return {
      list: reimbursements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取报销详情
  static async getReimbursementById(id: string) {
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
            avatar: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!reimbursement) {
      throw new Error('报销记录不存在');
    }

    return reimbursement;
  }

  // 审批报销
  static async processReimbursement(
    id: string,
    approverId: string,
    input: ProcessReimbursementInput
  ) {
    const { status, comment } = input;

    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
    });

    if (!reimbursement) {
      throw new Error('报销记录不存在');
    }

    if (reimbursement.status !== 'PENDING') {
      throw new Error('该报销申请已处理');
    }

    const updated = await prisma.reimbursement.update({
      where: { id },
      data: {
        status: status as any,
        approverId,
        approvedAt: new Date(),
        comment,
      },
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
            avatar: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
    });

    try {
      // 同步更新相关的审批实例状态
      await this.syncApprovalStatus(id, status, approverId, comment);
    } catch (error) {
      console.error('同步审批状态失败:', error);
      // 不抛出错误，继续返回报销记录
    }

    return updated;
  }

  // 同步审批状态
  private static async syncApprovalStatus(
    reimbursementId: string,
    status: 'APPROVED' | 'REJECTED',
    approverId: string,
    comment?: string
  ) {
    // 查找相关的审批实例
    const approval = await prisma.approval.findFirst({
      where: {
        title: { contains: `报销申请 - ¥${reimbursementId}` },
      },
      include: {
        tasks: true,
      },
    });

    if (!approval) {
      return;
    }

    // 更新审批实例状态
    const approvalStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: approvalStatus as any,
        completedAt: new Date(),
        currentNode: 'end',
      },
    });

    // 更新当前审批任务
    const currentTask = approval.tasks.find(t => !t.processedAt);
    if (currentTask) {
      await prisma.approvalTask.update({
        where: { id: currentTask.id },
        data: {
          action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
          comment,
          processedAt: new Date(),
        },
      });
    }
  }

  // 标记已付款
  static async markAsPaid(id: string) {
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
    });

    if (!reimbursement) {
      throw new Error('报销记录不存在');
    }

    if (reimbursement.status !== 'APPROVED') {
      throw new Error('只能标记已审批通过的报销');
    }

    const updated = await prisma.reimbursement.update({
      where: { id },
      data: { status: 'PAID' },
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
            avatar: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
    });

    return updated;
  }

  // 获取报销统计
  static async getStatistics(params: { startDate?: Date; endDate?: Date; userId?: string }) {
    const { startDate, endDate, userId } = params;

    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (userId) {
      where.applicantId = userId;
    }

    const [
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      totalAmount,
      byType,
    ] = await Promise.all([
      prisma.reimbursement.count({ where }),
      prisma.reimbursement.count({ where: { ...where, status: 'PENDING' } }),
      prisma.reimbursement.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.reimbursement.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.reimbursement.count({ where: { ...where, status: 'PAID' } }),
      prisma.reimbursement.aggregate({
        where: { ...where, status: { in: ['APPROVED', 'PAID'] } },
        _sum: { amount: true },
      }),
      prisma.reimbursement.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      totalAmount: totalAmount._sum.amount || 0,
      byType: byType.map(t => ({
        type: t.type,
        count: t._count.id,
        amount: t._sum.amount || 0,
      })),
    };
  }

  // 获取月度统计
  static async getMonthlyStatistics(year: number, userId?: string) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const where: any = {
      date: {
        gte: startOfYear,
        lte: endOfYear,
      },
    };

    if (userId) {
      where.applicantId = userId;
    }

    const reimbursements = await prisma.reimbursement.findMany({
      where,
      select: {
        date: true,
        amount: true,
        status: true,
      },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: 0,
      amount: 0,
    }));

    reimbursements.forEach(r => {
      const month = r.date.getMonth();
      if (r.status === 'APPROVED' || r.status === 'PAID') {
        monthlyData[month].count += 1;
        monthlyData[month].amount += Number(r.amount);
      }
    });

    return monthlyData;
  }
}
