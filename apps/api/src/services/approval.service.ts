import { prisma } from '../utils/prisma';
import { PaginationParams, PaginatedResponse } from '../types';

export interface CreateApprovalInput {
  templateId: string;
  title: string;
  formData: Record<string, any>;
}

export interface ProcessApprovalInput {
  action: 'APPROVE' | 'REJECT' | 'TRANSFER';
  comment?: string;
  transferTo?: string;
}

export class ApprovalService {
  // 获取审批模板列表
  static async getTemplates(params: PaginationParams & { keyword?: string; isActive?: boolean }) {
    const { page = 1, pageSize = 10, keyword, isActive } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [templates, total] = await Promise.all([
      prisma.approvalTemplate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.approvalTemplate.count({ where }),
    ]);

    return {
      list: templates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取审批模板详情
  static async getTemplateById(id: string) {
    const template = await prisma.approvalTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('审批模板不存在');
    }

    return template;
  }

  // 创建审批模板
  static async createTemplate(data: {
    name: string;
    code: string;
    icon?: string;
    description?: string;
    formSchema: any;
    flowConfig: any;
  }) {
    const existing = await prisma.approvalTemplate.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('模板编码已存在');
    }

    const template = await prisma.approvalTemplate.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    return template;
  }

  // 更新审批模板
  static async updateTemplate(id: string, data: {
    name?: string;
    icon?: string;
    description?: string;
    formSchema?: any;
    flowConfig?: any;
    isActive?: boolean;
  }) {
    const template = await prisma.approvalTemplate.update({
      where: { id },
      data,
    });

    return template;
  }

  // 删除审批模板
  static async deleteTemplate(id: string) {
    const template = await prisma.approvalTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { approvals: true },
        },
      },
    });

    if (!template) {
      throw new Error('模板不存在');
    }

    if (template._count.approvals > 0) {
      throw new Error('该模板已被使用，无法删除');
    }

    await prisma.approvalTemplate.delete({
      where: { id },
    });

    return true;
  }

  // 提交审批申请
  static async createApproval(input: CreateApprovalInput, applicantId: string) {
    const { templateId, title, formData } = input;

    // 验证模板是否存在
    const template = await prisma.approvalTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('审批模板不存在');
    }

    if (!template.isActive) {
      throw new Error('该审批模板已停用');
    }

    // 创建审批记录
    const approval = await prisma.approval.create({
      data: {
        templateId,
        applicantId,
        title,
        formData,
        status: 'PENDING',
        currentNode: (template.flowConfig as any)?.nodes?.[1]?.id || null,
      },
      include: {
        template: true,
        applicant: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });

    // 创建第一个审批任务
    const flowConfig = template.flowConfig as any;
    const firstNode = flowConfig?.nodes?.find((n: any) => n.type === 'approval');
    
    if (firstNode) {
      // 这里简化处理，实际应该根据配置确定审批人
      await prisma.approvalTask.create({
        data: {
          approvalId: approval.id,
          approverId: applicantId, // 实际应该根据规则确定
          nodeName: firstNode.name,
        },
      });
    }

    return approval;
  }

  // 获取我的审批申请列表
  static async getMyApprovals(
    applicantId: string,
    params: PaginationParams & { status?: string }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, status } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { applicantId };
    if (status) {
      where.status = status;
    }

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          template: true,
          tasks: {
            include: {
              approver: {
                select: {
                  id: true,
                  realName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.approval.count({ where }),
    ]);

    return {
      list: approvals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取待我审批的列表
  static async getPendingApprovals(
    approverId: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10 } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      status: 'PENDING',
      tasks: {
        some: {
          approverId,
          action: null,
        },
      },
    };

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          template: true,
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
          tasks: {
            include: {
              approver: {
                select: {
                  id: true,
                  realName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.approval.count({ where }),
    ]);

    return {
      list: approvals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取我已审批的列表
  static async getProcessedApprovals(
    approverId: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10 } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      tasks: {
        some: {
          approverId,
          action: { not: null },
        },
      },
    };

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          template: true,
          applicant: {
            select: {
              id: true,
              realName: true,
              avatar: true,
            },
          },
          tasks: {
            include: {
              approver: {
                select: {
                  id: true,
                  realName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.approval.count({ where }),
    ]);

    return {
      list: approvals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取审批详情
  static async getApprovalById(id: string, userId: string) {
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        template: true,
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
        tasks: {
          include: {
            approver: {
              select: {
                id: true,
                realName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!approval) {
      throw new Error('审批不存在');
    }

    // 检查权限
    const isApplicant = approval.applicantId === userId;
    const isApprover = approval.tasks.some(t => t.approverId === userId);

    if (!isApplicant && !isApprover) {
      throw new Error('无权查看该审批');
    }

    return approval;
  }

  // 处理审批任务
  static async processApproval(
    approvalId: string,
    taskId: string,
    approverId: string,
    input: ProcessApprovalInput
  ) {
    const { action, comment, transferTo } = input;

    const task = await prisma.approvalTask.findFirst({
      where: {
        id: taskId,
        approvalId,
        approverId,
        action: null,
      },
      include: {
        approval: {
          include: {
            template: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('审批任务不存在或已处理');
    }

    // 更新任务
    await prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        action: action as any,
        comment,
        processedAt: new Date(),
      },
    });

    // 处理转交
    if (action === 'TRANSFER' && transferTo) {
      await prisma.approvalTask.create({
        data: {
          approvalId,
          approverId: transferTo,
          nodeName: task.nodeName,
        },
      });
      return task.approval;
    }

    // 处理审批结果
    if (action === 'REJECT') {
      await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
      });
    } else if (action === 'APPROVE') {
      // 检查是否还有后续节点
      const flowConfig = task.approval.template.flowConfig as any;
      const currentNodeIndex = flowConfig?.nodes?.findIndex((n: any) => n.id === task.approval.currentNode);
      const nextNode = flowConfig?.nodes?.[currentNodeIndex + 1];

      if (nextNode && nextNode.type === 'approval') {
        // 创建下一个审批任务
        await prisma.approvalTask.create({
          data: {
            approvalId,
            approverId, // 实际应该根据配置确定
            nodeName: nextNode.name,
          },
        });

        await prisma.approval.update({
          where: { id: approvalId },
          data: { currentNode: nextNode.id },
        });
      } else {
        // 审批完成
        await prisma.approval.update({
          where: { id: approvalId },
          data: {
            status: 'APPROVED',
            completedAt: new Date(),
          },
        });
      }
    }

    return prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        template: true,
        applicant: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
        tasks: {
          include: {
            approver: {
              select: {
                id: true,
                realName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // 撤回审批
  static async withdrawApproval(id: string, applicantId: string) {
    const approval = await prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new Error('审批不存在');
    }

    if (approval.applicantId !== applicantId) {
      throw new Error('只能撤回自己的审批申请');
    }

    if (approval.status !== 'PENDING') {
      throw new Error('只能撤回待审批的申请');
    }

    await prisma.approval.update({
      where: { id },
      data: {
        status: 'WITHDRAWN',
        completedAt: new Date(),
      },
    });

    return true;
  }

  // 获取待审批数量
  static async getPendingCount(approverId: string) {
    return prisma.approval.count({
      where: {
        status: 'PENDING',
        tasks: {
          some: {
            approverId,
            action: null,
          },
        },
      },
    });
  }
}
