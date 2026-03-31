import { prisma } from '../utils/prisma';
import { ApprovalService } from './approval.service';

export class CRMApprovalService {
  // 为合同创建审批流程
  static async createContractApproval(
    contractId: string,
    contractName: string,
    amount: number,
    creatorId: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        customer: true,
      },
    });

    if (!contract) {
      throw new Error('合同不存在');
    }

    // 检查是否已经有审批流程
    const existingApproval = await prisma.approvalInstance.findFirst({
      where: {
        businessId: contractId,
        businessType: 'CONTRACT',
      },
    });

    if (existingApproval) {
      throw new Error('该合同已有审批流程');
    }

    // 创建审批模板（如果不存在）
    const templateCode = 'CONTRACT_APPROVAL';
    let template = await prisma.approvalTemplate.findUnique({
      where: { code: templateCode },
    });

    if (!template) {
      template = await prisma.approvalTemplate.create({
        data: {
          name: '合同审批流程',
          code: templateCode,
          icon: 'file-text',
          description: '合同签订审批流程',
          formSchema: {
            type: 'object',
            properties: {
              contractName: {
                title: '合同名称',
                type: 'string',
                readOnly: true,
              },
              customerName: {
                title: '客户名称',
                type: 'string',
                readOnly: true,
              },
              amount: {
                title: '合同金额',
                type: 'number',
                readOnly: true,
              },
              duration: {
                title: '合同期限',
                type: 'string',
                readOnly: true,
              },
              approvalOpinion: {
                title: '审批意见',
                type: 'string',
                required: true,
              },
            },
          },
          flowConfig: {
            nodes: [
              {
                id: 'start',
                type: 'start',
                position: { x: 100, y: 100 },
                data: { label: '开始' },
              },
              {
                id: 'department_approval',
                type: 'approval',
                position: { x: 300, y: 100 },
                data: {
                  label: '部门经理审批',
                  approverType: 'ROLE',
                  approverValue: 'DEPARTMENT_MANAGER',
                  description: '部门经理审核合同内容',
                },
              },
              {
                id: 'finance_approval',
                type: 'approval',
                position: { x: 500, y: 100 },
                data: {
                  label: '财务审批',
                  approverType: 'ROLE',
                  approverValue: 'FINANCE_MANAGER',
                  description: '财务审核合同金额',
                },
              },
              {
                id: 'general_manager_approval',
                type: 'approval',
                position: { x: 700, y: 100 },
                data: {
                  label: '总经理审批',
                  approverType: 'ROLE',
                  approverValue: 'GENERAL_MANAGER',
                  description: '总经理最终审批',
                  required: amount >= 100000, // 10万元以上需要总经理审批
                },
              },
              {
                id: 'end',
                type: 'end',
                position: { x: 900, y: 100 },
                data: { label: '结束' },
              },
            ],
            edges: [
              { id: 'e1', source: 'start', target: 'department_approval' },
              { id: 'e2', source: 'department_approval', target: 'finance_approval' },
              {
                id: 'e3',
                source: 'finance_approval',
                target: 'general_manager_approval',
                condition: { expression: 'amount >= 100000' },
              },
              {
                id: 'e4',
                source: 'finance_approval',
                target: 'end',
                condition: { expression: 'amount < 100000' },
              },
              { id: 'e5', source: 'general_manager_approval', target: 'end' },
            ],
          },
          isActive: true,
        },
      });
    }

    // 创建审批实例
    const formData = {
      contractName: contract.name,
      customerName: contract.customer.name,
      amount: contract.amount,
      duration: `${contract.startDate.toISOString().split('T')[0]} 至 ${
        contract.endDate.toISOString().split('T')[0]
      }`,
    };

    const approvalInstance = await ApprovalService.createApprovalInstance({
      templateId: template.id,
      title: `合同审批: ${contract.name}`,
      description: `客户: ${contract.customer.name}, 金额: ¥${contract.amount.toLocaleString()}`,
      businessType: 'CONTRACT',
      businessId: contractId,
      formData,
      creatorId,
    });

    // 更新合同状态为待审批
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'PENDING' },
    });

    return approvalInstance;
  }

  // 处理合同审批结果
  static async handleContractApprovalResult(
    approvalInstanceId: string,
    status: 'APPROVED' | 'REJECTED',
    comment?: string
  ) {
    const approvalInstance = await prisma.approvalInstance.findUnique({
      where: { id: approvalInstanceId },
      include: {
        template: true,
      },
    });

    if (!approvalInstance) {
      throw new Error('审批实例不存在');
    }

    // 获取关联的合同
    const contract = await prisma.contract.findUnique({
      where: { id: approvalInstance.businessId },
    });

    if (!contract) {
      throw new Error('关联的合同不存在');
    }

    // 更新合同状态
    let contractStatus = 'DRAFT';
    if (status === 'APPROVED') {
      contractStatus = 'ACTIVE';
    } else if (status === 'REJECTED') {
      contractStatus = 'REJECTED';
    }

    await prisma.contract.update({
      where: { id: contract.id },
      data: { status: contractStatus },
    });

    // 记录审批历史
    await prisma.approvalHistory.create({
      data: {
        instanceId: approvalInstanceId,
        action: status,
        comment: comment || '',
        handledAt: new Date(),
      },
    });

    // 发送通知（这里可以集成通知系统）
    await this.sendContractApprovalNotification(contract.id, status, comment);

    return {
      contractId: contract.id,
      contractName: contract.name,
      status: contractStatus,
      approvalStatus: status,
    };
  }

  // 发送合同审批通知
  private static async sendContractApprovalNotification(
    contractId: string,
    status: 'APPROVED' | 'REJECTED',
    comment?: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        customer: true,
      },
    });

    if (!contract) return;

    // 这里可以集成邮件、站内信、IM等通知系统
    console.log(`合同审批通知: 合同 "${contract.name}" 已${status === 'APPROVED' ? '通过' : '驳回'}`);
    if (comment) {
      console.log(`审批意见: ${comment}`);
    }

    // 实际项目中可以调用通知服务
    // await notificationService.send({
    //   type: 'CONTRACT_APPROVAL',
    //   userId: contract.creatorId,
    //   title: `合同审批${status === 'APPROVED' ? '通过' : '驳回'}`,
    //   content: `合同 "${contract.name}" 审批${status === 'APPROVED' ? '通过' : '驳回'}${comment ? `，意见：${comment}` : ''}`,
    // });
  }

  // 获取合同的审批状态
  static async getContractApprovalStatus(contractId: string) {
    const approvalInstance = await prisma.approvalInstance.findFirst({
      where: {
        businessId: contractId,
        businessType: 'CONTRACT',
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                realName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        template: true,
      },
    });

    if (!approvalInstance) {
      return null;
    }

    return {
      instanceId: approvalInstance.id,
      status: approvalInstance.status,
      tasks: approvalInstance.tasks.map(task => ({
        id: task.id,
        name: task.name,
        status: task.status,
        assignee: task.assignee,
        assignedAt: task.assignedAt,
        completedAt: task.completedAt,
        result: task.result,
        comment: task.comment,
      })),
      template: approvalInstance.template,
      createdAt: approvalInstance.createdAt,
      completedAt: approvalInstance.completedAt,
    };
  }

  // 取消合同审批流程
  static async cancelContractApproval(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error('合同不存在');
    }

    const approvalInstance = await prisma.approvalInstance.findFirst({
      where: {
        businessId: contractId,
        businessType: 'CONTRACT',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!approvalInstance) {
      throw new Error('未找到进行中的审批流程');
    }

    // 检查权限（只有创建者可以取消）
    if (approvalInstance.creatorId !== userId) {
      throw new Error('只有流程创建者可以取消审批');
    }

    // 取消审批实例
    await ApprovalService.cancelApprovalInstance(approvalInstance.id, userId);

    // 恢复合同状态为草稿
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'DRAFT' },
    });

    return true;
  }
}