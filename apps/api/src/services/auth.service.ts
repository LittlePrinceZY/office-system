import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { generateTokens } from '../utils/jwt';

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
  departmentId?: string;
}

export class AuthService {
  // 用户登录
  static async login(input: LoginInput) {
    const { username, password } = input;

    const user = await prisma.user.findUnique({
      where: { username },
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
      throw new Error('用户名或密码错误');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: '', // 可以从请求中获取
      },
    });

    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        isAdmin: user.isAdmin,
        roles: user.userRoles.map(ur => ur.role),
      },
      ...tokens,
    };
  }

  // 用户注册
  static async register(input: RegisterInput) {
    const { username, password, realName, email, phone, departmentId } = input;

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error('用户名已存在');
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
        departmentId,
        status: 'ACTIVE',
        isAdmin: false,
      },
      include: {
        department: true,
      },
    });

    // 分配默认角色（普通员工）
    const defaultRole = await prisma.role.findUnique({
      where: { code: 'employee' },
    });

    if (defaultRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
        },
      });
    }

    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        department: user.department,
        position: user.position,
        isAdmin: user.isAdmin,
      },
      ...tokens,
    };
  }

  // 刷新Token
  static async refreshToken(refreshToken: string) {
    const { verifyRefreshToken } = await import('../utils/jwt');
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error('Refresh Token无效');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new Error('用户不存在或已被禁用');
    }

    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    return tokens;
  }

  // 获取当前用户信息
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 提取所有权限
    const permissions = new Set<string>();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

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
      isAdmin: user.isAdmin,
      roles: user.userRoles.map(ur => ur.role),
      permissions: Array.from(permissions),
    };
  }

  // 修改密码
  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  }
}
