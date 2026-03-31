import { PrismaClient, UserStatus, PermissionType, ChatType, MessageType, ApprovalStatus, ReimbursementStatus, CustomerStatus, ContractStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 1. 创建系统配置
  await prisma.systemConfig.createMany({
    data: [
      { key: 'system_name', value: '智慧办公系统', description: '系统名称' },
      { key: 'system_logo', value: '/logo.png', description: '系统Logo' },
      { key: 'system_copyright', value: '© 2024 智慧办公系统', description: '版权信息' },
    ],
    skipDuplicates: true,
  });

  // 2. 创建权限
  const permissions = await createPermissions();
  console.log('权限创建完成');

  // 3. 创建角色
  const roles = await createRoles(permissions);
  console.log('角色创建完成');

  // 4. 创建部门
  const departments = await createDepartments();
  console.log('部门创建完成');

  // 5. 创建管理员用户
  const adminUser = await createAdminUser(departments[0].id, roles[0].id);
  console.log('管理员用户创建完成');

  // 6. 创建公告分类
  await createAnnouncementCategories();
  console.log('公告分类创建完成');

  // 7. 创建审批模板
  await createApprovalTemplates();
  console.log('审批模板创建完成');

  // 8. 创建示例数据
  await createSampleData(adminUser.id);
  console.log('示例数据创建完成');

  console.log('数据库初始化完成！');
}

async function createPermissions() {
  // 系统管理
  const systemMenu = await prisma.permission.create({
    data: {
      name: '系统管理',
      code: 'system',
      type: PermissionType.MENU,
      path: '/system',
      icon: 'SettingOutlined',
      sortOrder: 100,
    },
  });

  const permissions = [systemMenu];

  // 系统管理子菜单
  const systemChildren = [
    { name: '用户管理', code: 'system:user', path: '/system/users', icon: 'UserOutlined' },
    { name: '角色管理', code: 'system:role', path: '/system/roles', icon: 'TeamOutlined' },
    { name: '权限管理', code: 'system:permission', path: '/system/permissions', icon: 'SafetyOutlined' },
    { name: '部门管理', code: 'system:department', path: '/system/departments', icon: 'ApartmentOutlined' },
    { name: '系统配置', code: 'system:config', path: '/system/config', icon: 'ToolOutlined' },
  ];

  for (const child of systemChildren) {
    const perm = await prisma.permission.create({
      data: {
        ...child,
        type: PermissionType.MENU,
        parentId: systemMenu.id,
        sortOrder: permissions.length,
      },
    });
    permissions.push(perm);
  }

  // 通讯录
  const contactMenu = await prisma.permission.create({
    data: {
      name: '通讯录',
      code: 'contact',
      type: PermissionType.MENU,
      path: '/contacts',
      icon: 'ContactsOutlined',
      sortOrder: 200,
    },
  });
  permissions.push(contactMenu);

  // 聊天
  const chatMenu = await prisma.permission.create({
    data: {
      name: '即时通讯',
      code: 'chat',
      type: PermissionType.MENU,
      path: '/chat',
      icon: 'MessageOutlined',
      sortOrder: 300,
    },
  });
  permissions.push(chatMenu);

  // 审批
  const approvalMenu = await prisma.permission.create({
    data: {
      name: '审批管理',
      code: 'approval',
      type: PermissionType.MENU,
      path: '/approvals',
      icon: 'FileTextOutlined',
      sortOrder: 400,
    },
  });
  permissions.push(approvalMenu);

  const approvalChildren = [
    { name: '我的申请', code: 'approval:my', path: '/approvals/my', icon: 'FormOutlined' },
    { name: '待我审批', code: 'approval:pending', path: '/approvals/pending', icon: 'AuditOutlined' },
    { name: '已办事项', code: 'approval:done', path: '/approvals/done', icon: 'CheckCircleOutlined' },
    { name: '流程模板', code: 'approval:template', path: '/approvals/templates', icon: 'ProfileOutlined' },
  ];

  for (const child of approvalChildren) {
    const perm = await prisma.permission.create({
      data: {
        ...child,
        type: PermissionType.MENU,
        parentId: approvalMenu.id,
        sortOrder: permissions.length,
      },
    });
    permissions.push(perm);
  }

  // 公告
  const announcementMenu = await prisma.permission.create({
    data: {
      name: '公示公告',
      code: 'announcement',
      type: PermissionType.MENU,
      path: '/announcements',
      icon: 'NotificationOutlined',
      sortOrder: 500,
    },
  });
  permissions.push(announcementMenu);

  // 财务报销
  const financeMenu = await prisma.permission.create({
    data: {
      name: '财务报销',
      code: 'finance',
      type: PermissionType.MENU,
      path: '/finance',
      icon: 'DollarOutlined',
      sortOrder: 600,
    },
  });
  permissions.push(financeMenu);

  const financeChildren = [
    { name: '报销申请', code: 'finance:reimbursement', path: '/finance/reimbursements', icon: 'WalletOutlined' },
    { name: '报销审批', code: 'finance:approval', path: '/finance/approvals', icon: 'SafetyCertificateOutlined' },
    { name: '报销统计', code: 'finance:statistics', path: '/finance/statistics', icon: 'BarChartOutlined' },
  ];

  for (const child of financeChildren) {
    const perm = await prisma.permission.create({
      data: {
        ...child,
        type: PermissionType.MENU,
        parentId: financeMenu.id,
        sortOrder: permissions.length,
      },
    });
    permissions.push(perm);
  }

  // 客户管理
  const crmMenu = await prisma.permission.create({
    data: {
      name: '客户管理',
      code: 'crm',
      type: PermissionType.MENU,
      path: '/crm',
      icon: 'CustomerServiceOutlined',
      sortOrder: 700,
    },
  });
  permissions.push(crmMenu);

  const crmChildren = [
    { name: '客户列表', code: 'crm:customer', path: '/crm/customers', icon: 'SolutionOutlined' },
    { name: '联系人', code: 'crm:contact', path: '/crm/contacts', icon: 'IdcardOutlined' },
    { name: '跟进记录', code: 'crm:followup', path: '/crm/followups', icon: 'HistoryOutlined' },
    { name: '合同管理', code: 'crm:contract', path: '/crm/contracts', icon: 'FileProtectOutlined' },
  ];

  for (const child of crmChildren) {
    const perm = await prisma.permission.create({
      data: {
        ...child,
        type: PermissionType.MENU,
        parentId: crmMenu.id,
        sortOrder: permissions.length,
      },
    });
    permissions.push(perm);
  }

  // 门户
  const portalMenu = await prisma.permission.create({
    data: {
      name: '门户页面',
      code: 'portal',
      type: PermissionType.MENU,
      path: '/portal',
      icon: 'HomeOutlined',
      sortOrder: 0,
    },
  });
  permissions.push(portalMenu);

  return permissions;
}

async function createRoles(permissions: any[]) {
  // 超级管理员
  const adminRole = await prisma.role.create({
    data: {
      name: '超级管理员',
      code: 'super_admin',
      description: '拥有系统所有权限',
      isSystem: true,
    },
  });

  // 为超级管理员分配所有权限
  for (const perm of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // 普通员工
  const employeeRole = await prisma.role.create({
    data: {
      name: '普通员工',
      code: 'employee',
      description: '普通员工权限',
      isSystem: true,
    },
  });

  // 部门经理
  const managerRole = await prisma.role.create({
    data: {
      name: '部门经理',
      code: 'manager',
      description: '部门经理权限',
      isSystem: true,
    },
  });

  return [adminRole, employeeRole, managerRole];
}

async function createDepartments() {
  const company = await prisma.department.create({
    data: {
      name: '总公司',
      code: 'COMPANY',
      sortOrder: 0,
      description: '公司总部',
    },
  });

  const departments = [company];

  const subDepts = [
    { name: '技术部', code: 'TECH' },
    { name: '销售部', code: 'SALES' },
    { name: '财务部', code: 'FINANCE' },
    { name: '人力资源部', code: 'HR' },
    { name: '行政部', code: 'ADMIN' },
  ];

  for (const dept of subDepts) {
    const created = await prisma.department.create({
      data: {
        ...dept,
        parentId: company.id,
        sortOrder: departments.length,
      },
    });
    departments.push(created);
  }

  return departments;
}

async function createAdminUser(departmentId: string, roleId: string) {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      email: 'admin@company.com',
      phone: '13800138000',
      employeeId: 'EMP001',
      departmentId,
      position: '系统管理员',
      status: UserStatus.ACTIVE,
      isAdmin: true,
      userRoles: {
        create: {
          roleId,
        },
      },
    },
  });

  return admin;
}

async function createAnnouncementCategories() {
  const categories = [
    { name: '公司新闻', code: 'company_news', sortOrder: 1 },
    { name: '通知公告', code: 'notice', sortOrder: 2 },
    { name: '规章制度', code: 'regulation', sortOrder: 3 },
    { name: '活动通知', code: 'activity', sortOrder: 4 },
  ];

  for (const cat of categories) {
    await prisma.announcementCategory.create({
      data: cat,
    });
  }
}

async function createApprovalTemplates() {
  const templates = [
    {
      name: '请假申请',
      code: 'leave',
      icon: 'CalendarOutlined',
      description: '员工请假申请流程',
      formSchema: {
        type: 'object',
        properties: {
          leaveType: {
            type: 'string',
            title: '请假类型',
            enum: ['年假', '病假', '事假', '婚假', '产假', '丧假'],
          },
          startDate: {
            type: 'string',
            format: 'date',
            title: '开始日期',
          },
          endDate: {
            type: 'string',
            format: 'date',
            title: '结束日期',
          },
          days: {
            type: 'number',
            title: '请假天数',
          },
          reason: {
            type: 'string',
            title: '请假原因',
            'x-component': 'textarea',
          },
        },
        required: ['leaveType', 'startDate', 'endDate', 'days', 'reason'],
      },
      flowConfig: {
        nodes: [
          { id: 'start', name: '开始', type: 'start' },
          { id: 'dept_manager', name: '部门经理审批', type: 'approval', approver: 'dept_manager' },
          { id: 'hr', name: '人事审批', type: 'approval', approver: 'hr' },
          { id: 'end', name: '结束', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'dept_manager' },
          { from: 'dept_manager', to: 'hr', condition: 'approved' },
          { from: 'dept_manager', to: 'end', condition: 'rejected' },
          { from: 'hr', to: 'end' },
        ],
      },
    },
    {
      name: '加班申请',
      code: 'overtime',
      icon: 'ClockCircleOutlined',
      description: '员工加班申请流程',
      formSchema: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
            title: '加班日期',
          },
          startTime: {
            type: 'string',
            format: 'time',
            title: '开始时间',
          },
          endTime: {
            type: 'string',
            format: 'time',
            title: '结束时间',
          },
          hours: {
            type: 'number',
            title: '加班时长',
          },
          reason: {
            type: 'string',
            title: '加班原因',
            'x-component': 'textarea',
          },
        },
        required: ['date', 'startTime', 'endTime', 'hours', 'reason'],
      },
      flowConfig: {
        nodes: [
          { id: 'start', name: '开始', type: 'start' },
          { id: 'dept_manager', name: '部门经理审批', type: 'approval', approver: 'dept_manager' },
          { id: 'end', name: '结束', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'dept_manager' },
          { from: 'dept_manager', to: 'end' },
        ],
      },
    },
    {
      name: '外出申请',
      code: 'outgoing',
      icon: 'CarOutlined',
      description: '员工外出申请流程',
      formSchema: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            title: '外出地点',
          },
          startTime: {
            type: 'string',
            format: 'date-time',
            title: '开始时间',
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            title: '结束时间',
          },
          reason: {
            type: 'string',
            title: '外出原因',
            'x-component': 'textarea',
          },
        },
        required: ['destination', 'startTime', 'endTime', 'reason'],
      },
      flowConfig: {
        nodes: [
          { id: 'start', name: '开始', type: 'start' },
          { id: 'dept_manager', name: '部门经理审批', type: 'approval', approver: 'dept_manager' },
          { id: 'end', name: '结束', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'dept_manager' },
          { from: 'dept_manager', to: 'end' },
        ],
      },
    },
  ];

  for (const template of templates) {
    await prisma.approvalTemplate.create({
      data: template as any,
    });
  }
}

async function createSampleData(adminId: string) {
  // 创建示例公告
  const category = await prisma.announcementCategory.findFirst({
    where: { code: 'company_news' },
  });

  if (category) {
    await prisma.announcement.create({
      data: {
        title: '欢迎使用智慧办公系统',
        content: '智慧办公系统正式上线！本系统包含通讯录、即时通讯、审批管理、公示公告、财务报销、客户管理等功能，助力企业高效办公。',
        categoryId: category.id,
        isPublished: true,
        publishedAt: new Date(),
        authorId: adminId,
        isTop: true,
      },
    });
  }

  // 创建示例客户
  const customer = await prisma.customer.create({
    data: {
      name: '示例科技有限公司',
      type: 'ENTERPRISE',
      industry: '互联网',
      scale: '100-500人',
      address: '北京市朝阳区',
      description: '这是一家示例客户公司',
      status: 'FOLLOWING',
      ownerId: adminId,
    },
  });

  // 创建示例联系人
  await prisma.contact.create({
    data: {
      customerId: customer.id,
      name: '张三',
      title: '技术总监',
      phone: '13800138001',
      email: 'zhangsan@example.com',
      isPrimary: true,
      createdBy: adminId,
    },
  });

  // 创建示例合同
  await prisma.contract.create({
    data: {
      customerId: customer.id,
      code: 'CTR-2024-001',
      name: '软件开发服务合同',
      amount: 100000.00,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'ACTIVE',
      content: '软件开发服务合同内容...',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
