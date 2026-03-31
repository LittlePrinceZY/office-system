import { prisma } from '../utils/prisma';
import { PaginationParams, PaginatedResponse } from '../types';

export interface CreateCustomerInput {
  name: string;
  type: string;
  industry?: string;
  scale?: string;
  website?: string;
  address?: string;
  description?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  type?: string;
  industry?: string;
  scale?: string;
  website?: string;
  address?: string;
  description?: string;
  status?: string;
  ownerId?: string;
}

export interface CreateContactInput {
  customerId: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  isPrimary?: boolean;
}

export interface CreateFollowUpInput {
  customerId: string;
  content: string;
  type: string;
  nextPlan?: string;
  nextDate?: Date;
}

export interface CreateContractInput {
  customerId: string;
  code: string;
  name: string;
  amount: number;
  currency?: string;
  startDate: Date;
  endDate: Date;
  content?: string;
  attachments?: string[];
}

export class CRMService {
  // ========== 客户管理 ==========

  // 获取客户列表
  static async getCustomers(
    params: PaginationParams & { keyword?: string; status?: string; ownerId?: string }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, keyword, status, ownerId } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { address: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              realName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              contacts: true,
              contracts: true,
              followUps: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const list = customers.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      industry: c.industry,
      scale: c.scale,
      website: c.website,
      address: c.address,
      description: c.description,
      status: c.status,
      owner: c.owner,
      contactCount: c._count.contacts,
      contractCount: c._count.contracts,
      followUpCount: c._count.followUps,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取客户详情
  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
        contacts: {
          orderBy: { isPrimary: 'desc' },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          include: {
            creator: {
              select: {
                id: true,
                realName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new Error('客户不存在');
    }

    return customer;
  }

  // 创建客户
  static async createCustomer(input: CreateCustomerInput, ownerId: string) {
    const customer = await prisma.customer.create({
      data: {
        ...input,
        status: 'POTENTIAL',
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });

    return customer;
  }

  // 更新客户
  static async updateCustomer(id: string, input: UpdateCustomerInput) {
    const customer = await prisma.customer.update({
      where: { id },
      data: input,
      include: {
        owner: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });

    return customer;
  }

  // 删除客户
  static async deleteCustomer(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('客户不存在');
    }

    if (customer._count.contracts > 0) {
      throw new Error('该客户下存在合同，无法删除');
    }

    await prisma.customer.delete({
      where: { id },
    });

    return true;
  }

  // ========== 联系人管理 ==========

  // 获取联系人列表
  static async getContacts(
    params: PaginationParams & { customerId?: string; keyword?: string }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, customerId, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      list: contacts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 创建联系人
  static async createContact(input: CreateContactInput, createdBy: string) {
    const { customerId, isPrimary } = input;

    // 验证客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('客户不存在');
    }

    // 如果设置为首要联系人，取消其他首要联系人
    if (isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        ...input,
        createdBy,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return contact;
  }

  // 更新联系人
  static async updateContact(id: string, data: Partial<CreateContactInput>) {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new Error('联系人不存在');
    }

    // 如果设置为首要联系人，取消其他首要联系人
    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId: contact.customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  // 删除联系人
  static async deleteContact(id: string) {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new Error('联系人不存在');
    }

    await prisma.contact.delete({
      where: { id },
    });

    return true;
  }

  // ========== 跟进记录 ==========

  // 获取跟进记录列表
  static async getFollowUps(
    params: PaginationParams & { customerId?: string; createdBy?: string }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, customerId, createdBy } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              realName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.followUp.count({ where }),
    ]);

    return {
      list: followUps,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 创建跟进记录
  static async createFollowUp(input: CreateFollowUpInput, createdBy: string) {
    const { customerId } = input;

    // 验证客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('客户不存在');
    }

    const followUp = await prisma.followUp.create({
      data: {
        ...input,
        createdBy,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });

    // 更新客户状态为跟进中
    if (customer.status === 'POTENTIAL') {
      await prisma.customer.update({
        where: { id: customerId },
        data: { status: 'FOLLOWING' },
      });
    }

    return followUp;
  }

  // 删除跟进记录
  static async deleteFollowUp(id: string) {
    const followUp = await prisma.followUp.findUnique({
      where: { id },
    });

    if (!followUp) {
      throw new Error('跟进记录不存在');
    }

    await prisma.followUp.delete({
      where: { id },
    });

    return true;
  }

  // ========== 合同管理 ==========

  // 获取合同列表
  static async getContracts(
    params: PaginationParams & { customerId?: string; status?: string; keyword?: string }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, customerId, status, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      list: contracts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取合同详情
  static async getContractById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error('合同不存在');
    }

    return contract;
  }

  // 创建合同
  static async createContract(input: CreateContractInput) {
    const { customerId, code } = input;

    // 验证客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('客户不存在');
    }

    // 检查合同编号是否已存在
    const existing = await prisma.contract.findUnique({
      where: { code },
    });

    if (existing) {
      throw new Error('合同编号已存在');
    }

    const contract = await prisma.contract.create({
      data: {
        ...input,
        status: 'DRAFT',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return contract;
  }

  // 更新合同
  static async updateContract(id: string, data: Partial<CreateContractInput & { status?: string }>) {
    const contract = await prisma.contract.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return contract;
  }

  // 删除合同
  static async deleteContract(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new Error('合同不存在');
    }

    if (contract.status === 'ACTIVE') {
      throw new Error('生效中的合同不能删除');
    }

    await prisma.contract.delete({
      where: { id },
    });

    return true;
  }

  // 获取CRM统计
  static async getStatistics() {
    const [
      totalCustomers,
      potentialCustomers,
      followingCustomers,
      signedCustomers,
      totalContracts,
      activeContracts,
      totalContractAmount,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'POTENTIAL' } }),
      prisma.customer.count({ where: { status: 'FOLLOWING' } }),
      prisma.customer.count({ where: { status: 'SIGNED' } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.contract.aggregate({
        where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCustomers,
      potentialCustomers,
      followingCustomers,
      signedCustomers,
      totalContracts,
      activeContracts,
      totalContractAmount: totalContractAmount._sum.amount || 0,
    };
  }
}
