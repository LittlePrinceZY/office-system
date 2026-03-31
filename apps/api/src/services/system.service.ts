import { prisma } from '../utils/prisma';

export class SystemService {
  // 获取系统配置
  static async getConfigs() {
    const configs = await prisma.systemConfig.findMany();
    const configMap: Record<string, string> = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });
    return configMap;
  }

  // 获取单个配置
  static async getConfig(key: string) {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });
    return config?.value;
  }

  // 更新系统配置
  static async updateConfigs(configs: Record<string, string>, updatedBy: string) {
    const results = await Promise.all(
      Object.entries(configs).map(async ([key, value]) => {
        return prisma.systemConfig.upsert({
          where: { key },
          update: { value, updatedBy },
          create: { key, value, updatedBy },
        });
      })
    );
    return results;
  }

  // 获取系统名称
  static async getSystemName() {
    const name = await this.getConfig('system_name');
    return name || '智慧办公系统';
  }

  // 获取仪表盘统计
  static async getDashboardStats(userId: string) {
    const [
      pendingApprovals,
      pendingReimbursements,
      unreadAnnouncements,
      myCustomers,
      recentContracts,
    ] = await Promise.all([
      // 待审批数量
      prisma.approval.count({
        where: {
          status: 'PENDING',
          tasks: {
            some: {
              approverId: userId,
              action: null,
            },
          },
        },
      }),
      // 待审批报销
      prisma.reimbursement.count({
        where: { status: 'PENDING' },
      }),
      // 未读公告
      (async () => {
        const totalPublished = await prisma.announcement.count({
          where: { isPublished: true },
        });
        const readCount = await prisma.announcementRead.count({
          where: { userId },
        });
        return totalPublished - readCount;
      })(),
      // 我的客户数
      prisma.customer.count({
        where: { ownerId: userId },
      }),
      // 近期合同金额
      prisma.contract.aggregate({
        where: {
          status: 'ACTIVE',
          customer: { ownerId: userId },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      pendingApprovals,
      pendingReimbursements,
      unreadAnnouncements,
      myCustomers,
      recentContractAmount: recentContracts._sum.amount || 0,
    };
  }

  // 获取待办事项
  static async getTodos(userId: string) {
    const [pendingApprovals, unreadAnnouncements, pendingReimbursements] = await Promise.all([
      // 待审批
      prisma.approval.findMany({
        where: {
          status: 'PENDING',
          tasks: {
            some: {
              approverId: userId,
              action: null,
            },
          },
        },
        include: {
          template: true,
          applicant: {
            select: {
              realName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // 未读公告
      (async () => {
        const readIds = await prisma.announcementRead.findMany({
          where: { userId },
          select: { announcementId: true },
        });
        const readIdList = readIds.map(r => r.announcementId);

        return prisma.announcement.findMany({
          where: {
            isPublished: true,
            id: { notIn: readIdList },
          },
          include: {
            category: true,
          },
          orderBy: [{ isTop: 'desc' }, { publishedAt: 'desc' }],
          take: 5,
        });
      })(),
      // 我的报销状态
      prisma.reimbursement.findMany({
        where: {
          applicantId: userId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      approvals: pendingApprovals.map(a => ({
        id: a.id,
        type: 'approval',
        title: a.title,
        description: `${a.applicant.realName} 提交的 ${a.template.name}`,
        createdAt: a.createdAt,
        link: `/approvals/pending/${a.id}`,
      })),
      announcements: unreadAnnouncements.map(a => ({
        id: a.id,
        type: 'announcement',
        title: a.title,
        description: a.category.name,
        createdAt: a.publishedAt,
        link: `/announcements/${a.id}`,
      })),
      reimbursements: pendingReimbursements.map(r => ({
        id: r.id,
        type: 'reimbursement',
        title: `${r.type}报销`,
        description: `金额: ¥${r.amount}`,
        createdAt: r.createdAt,
        link: '/finance/reimbursements',
      })),
    };
  }
}
