import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { PaginationParams, PaginatedResponse } from '../types';

export interface CreateUserInput {
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  departmentId?: string;
  position?: string;
  roleIds?: string[];
  status?: string;
}

export interface UpdateUserInput {
  realName?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  departmentId?: string;
  position?: string;
  avatar?: string;
  roleIds?: string[];
  status?: string;
}

export class UserService {
  // 获取用户列表
  static async getUsers(params: PaginationParams & { keyword?: string; departmentId?: string }): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, keyword, departmentId } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { realName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const list = users.map(user => ({
      id: user.id,
      username: user.username,
      realName: user.realName,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      department: user.department,
      position: user.position,
      status: user.status,
      isAdmin: user.isAdmin,
      lastLoginAt: user.lastLoginAt,
      roles: user.userRoles.map(ur => ur.role),
      createdAt: user.createdAt,
    }));

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取用户详情
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      department: user.department,
      position: user.position,
      status: user.status,
      isAdmin: user.isAdmin,
      lastLoginAt: user.lastLoginAt,
      roles: user.userRoles.map(ur => ur.role),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // 创建用户
  static async createUser(input: CreateUserInput) {
    const { username, password, realName, email, phone, employeeId, departmentId, position, roleIds, status } = input;

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查员工号是否已存在
    if (employeeId) {
      const existingEmployee = await prisma.user.findUnique({
        where: { employeeId },
      });
      if (existingEmployee) {
        throw new Error('员工号已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        email,
        phone,
        employeeId,
        departmentId,
        position,
        status: status as any || 'ACTIVE',
      },
      include: {
        department: true,
      },
    });

    // 分配角色
    if (roleIds && roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    return this.getUserById(user.id);
  }

  // 更新用户
  static async updateUser(id: string, input: UpdateUserInput) {
    const { realName, email, phone, employeeId, departmentId, position, avatar, roleIds, status } = input;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 检查员工号是否已被其他用户使用
    if (employeeId && employeeId !== existingUser.employeeId) {
      const duplicateEmployee = await prisma.user.findUnique({
        where: { employeeId },
      });
      if (duplicateEmployee) {
        throw new Error('员工号已存在');
      }
    }

    // 更新用户信息
    await prisma.user.update({
      where: { id },
      data: {
        realName,
        email,
        phone,
        employeeId,
        departmentId,
        position,
        avatar,
        status: status as any,
      },
    });

    // 更新角色
    if (roleIds !== undefined) {
      // 删除原有角色
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // 添加新角色
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId: id,
            roleId,
          })),
        });
      }
    }

    return this.getUserById(id);
  }

  // 删除用户
  static async deleteUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.isAdmin) {
      throw new Error('不能删除管理员账号');
    }

    await prisma.user.delete({
      where: { id },
    });

    return true;
  }

  // 重置密码
  static async resetPassword(id: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return true;
  }

  // 获取通讯录列表
  static async getContacts(params: PaginationParams & { keyword?: string; departmentId?: string }) {
    return this.getUsers(params);
  }

  // 获取组织架构树
  static async getDepartmentTree() {
    const departments = await prisma.department.findMany({
      include: {
        users: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
            position: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // 构建树形结构
    const buildTree = (parentId: string | null): any[] => {
      return departments
        .filter(dept => dept.parentId === parentId)
        .map(dept => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.description,
          users: dept.users,
          children: buildTree(dept.id),
        }));
    };

    return buildTree(null);
  }
}
