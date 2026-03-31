import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Avatar,
  message,
  Popconfirm,
  Dropdown,
  Menu,
  Drawer,
  Descriptions,
  Badge,
  Row,
  Col,
  InputNumber,
  Upload,
  DatePicker,
  Tooltip,
  Divider,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UserOutlined,
  MoreOutlined,
  EyeOutlined,
  DownloadOutlined,
  ImportOutlined,
  ExportOutlined,
  ReloadOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  IdcardOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StopOutlined,
  FilterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import request from '../../../../utils/request';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

interface User {
  id: string;
  username: string;
  realName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  department?: { id: string; name: string };
  position?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  isAdmin: boolean;
  roles: Array<{ id: string; name: string; code: string }>;
  lastLoginTime?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthday?: string;
  joinDate?: string;
  workStatus?: '在职' | '离职' | '休假';
}

interface SearchParams {
  keyword?: string;
  status?: string;
  departmentId?: string;
  roleId?: string;
  startDate?: string;
  endDate?: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [importForm] = Form.useForm();
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchUsers = async (params?: SearchParams) => {
    setLoading(true);
    try {
      const queryParams = {
        page: currentPage,
        pageSize,
        ...searchParams,
        ...params,
      };
      
      // 清理空参数
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof typeof queryParams] === '' || queryParams[key as keyof typeof queryParams] === undefined) {
          delete queryParams[key as keyof typeof queryParams];
        }
      });
      
      const data = await request.get('/users', { params: queryParams });
      setUsers(data.list || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('获取用户失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await request.get('/users/departments/tree');
      setDepartments(data);
    } catch (error) {
      console.error('获取部门失败:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await request.get('/system/roles');
      setRoles(data.list);
    } catch (error) {
      console.error('获取角色失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      departmentId: record.department?.id,
      roleIds: record.roles.map((r) => r.id),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/users/${id}`);
      message.success('删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await request.put(`/users/${editingUser.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/users', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      // 错误已在request中处理
    }
  };

  const handleSearch = async () => {
    try {
      const values = await searchForm.validateFields();
      setSearchParams(values);
      setCurrentPage(1);
      fetchUsers(values);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({});
    setCurrentPage(1);
    fetchUsers({});
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    fetchUsers(searchParams);
  };

  const handleViewDetail = async (user: User) => {
    setSelectedUser(user);
    setDetailVisible(true);
    // 可以在这里加载更多用户详情信息
  };

  const handleResetPassword = async (userId: string) => {
    Modal.confirm({
      title: '重置密码',
      content: '确定要重置该用户的密码吗？重置后密码将变为默认密码。',
      onOk: async () => {
        try {
          await request.post(`/users/${userId}/reset-password`);
          message.success('密码重置成功');
        } catch (error) {
          message.error('密码重置失败');
        }
      },
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的用户');
      return;
    }

    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个用户吗？`,
      onOk: async () => {
        try {
          await request.delete('/users/batch', { data: { ids: selectedRowKeys } });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          fetchUsers();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleBatchUpdateStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的用户');
      return;
    }

    Modal.confirm({
      title: status === 'ACTIVE' ? '批量启用' : '批量禁用',
      content: `确定要${status === 'ACTIVE' ? '启用' : '禁用'}选中的 ${selectedRowKeys.length} 个用户吗？`,
      onOk: async () => {
        try {
          await request.put('/users/batch-status', { ids: selectedRowKeys, status });
          message.success(`${status === 'ACTIVE' ? '启用' : '禁用'}成功`);
          setSelectedRowKeys([]);
          fetchUsers();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await request.get('/users/export', {
        params: searchParams,
        responseType: 'blob',
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (values: any) => {
    try {
      if (!values.file) {
        message.error('请选择要导入的文件');
        return;
      }

      const formData = new FormData();
      formData.append('file', values.file.file);
      
      await request.post('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      message.success('导入成功');
      setImportVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('导入失败');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'realName',
      key: 'realName',
      width: 180,
      render: (text: string, record: User) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-gray-500 text-xs">{record.username}</div>
            <div className="text-gray-400 text-xs">{record.employeeId}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 200,
      render: (record: User) => (
        <div>
          <div className="flex items-center text-gray-600">
            <MailOutlined className="mr-2" />
            <span className="truncate">{record.email || '-'}</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <PhoneOutlined className="mr-2" />
            <span>{record.phone || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      title: '部门/职位',
      key: 'departmentPosition',
      width: 180,
      render: (record: User) => (
        <div>
          <div className="font-medium">{record.department?.name || '-'}</div>
          <div className="text-gray-500 text-sm">{record.position || '-'}</div>
        </div>
      ),
    },
    {
      title: '角色',
      key: 'roles',
      width: 200,
      render: (record: User) => (
        <Space wrap>
          {record.isAdmin && <Tag color="red">管理员</Tag>}
          {record.roles.map((role) => (
            <Tag key={role.id} color="blue">
              {role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: User) => {
        const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          ACTIVE: { color: 'success', text: '正常', icon: <CheckCircleOutlined /> },
          INACTIVE: { color: 'error', text: '禁用', icon: <StopOutlined /> },
          LOCKED: { color: 'warning', text: '锁定', icon: <LockOutlined /> },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };
        
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '最后登录',
      key: 'lastLogin',
      width: 180,
      render: (record: User) => (
        <div>
          <div className="text-gray-600 text-sm">
            {record.lastLoginTime ? dayjs(record.lastLoginTime).format('YYYY-MM-DD HH:mm') : '从未登录'}
          </div>
          {record.lastLoginIp && (
            <div className="text-gray-400 text-xs">
              IP: {record.lastLoginIp}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (record: User) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: '查看详情',
            icon: <EyeOutlined />,
            onClick: () => handleViewDetail(record),
          },
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: 'reset-password',
            label: '重置密码',
            icon: <LockOutlined />,
            onClick: () => handleResetPassword(record.id),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record.id),
          },
        ];

        return (
          <Space size="small">
            <Tooltip title="查看详情">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const batchMenuItems: MenuProps['items'] = [
    {
      key: 'active',
      label: '批量启用',
      icon: <CheckCircleOutlined />,
      onClick: () => handleBatchUpdateStatus('ACTIVE'),
    },
    {
      key: 'inactive',
      label: '批量禁用',
      icon: <StopOutlined />,
      onClick: () => handleBatchUpdateStatus('INACTIVE'),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleBatchDelete,
    },
  ];

  const handleExportTemplate = async () => {
    try {
      const response = await request.get('/users/template', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `用户导入模板_${dayjs().format('YYYYMMDD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('模板下载成功');
    } catch (error) {
      message.error('模板下载失败');
    }
  };

  return (
    <div className="users-page">
      <Card>
        {/* 搜索表单 */}
        <div className="mb-6">
          <Form
            form={searchForm}
            layout="inline"
            onFinish={handleSearch}
          >
            <Row gutter={[16, 16]} className="w-full">
              <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                <Form.Item name="keyword" label={null}>
                  <Input
                    placeholder="搜索用户名/姓名/邮箱/手机"
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                <Form.Item name="status" label={null}>
                  <Select
                    placeholder="状态"
                    allowClear
                    options={[
                      { label: '正常', value: 'ACTIVE' },
                      { label: '禁用', value: 'INACTIVE' },
                      { label: '锁定', value: 'LOCKED' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                <Form.Item name="departmentId" label={null}>
                  <Select
                    placeholder="部门"
                    allowClear
                    options={departments.map(dept => ({
                      label: dept.name,
                      value: dept.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                <Form.Item name="roleId" label={null}>
                  <Select
                    placeholder="角色"
                    allowClear
                    options={roles.map(role => ({
                      label: role.name,
                      value: role.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                <Form.Item name="startDate" label={null}>
                  <DatePicker
                    placeholder="开始日期"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8} lg={6} xl={6}>
                <Form.Item name="endDate" label={null}>
                  <DatePicker
                    placeholder="结束日期"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8} lg={12} xl={12}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                  >
                    搜索
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => {
                      // 更多筛选条件
                    }}
                  >
                    更多筛选
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>

        {/* 工具栏 */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold mb-1">用户管理</h2>
              <p className="text-gray-600 text-sm">管理系统用户账号和权限</p>
            </div>
            <Space>
              {selectedRowKeys.length > 0 && (
                <div className="mr-4">
                  <Space>
                    <span className="text-gray-600">
                      已选择 {selectedRowKeys.length} 项
                    </span>
                    <Button type="link" onClick={() => setSelectedRowKeys([])}>
                      取消选择
                    </Button>
                    <Dropdown menu={{ items: batchMenuItems }}>
                      <Button>批量操作</Button>
                    </Dropdown>
                  </Space>
                </div>
              )}
              <Button
                icon={<ImportOutlined />}
                onClick={() => setImportVisible(true)}
              >
                导入
              </Button>
              <Button
                icon={<ExportOutlined />}
                loading={exportLoading}
                onClick={handleExport}
              >
                导出
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                新增用户
              </Button>
            </Space>
          </div>
        </div>

        {/* 用户统计卡片 */}
        <div className="mb-6">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card size="small">
                <div className="flex items-center">
                  <Avatar
                    icon={<TeamOutlined />}
                    className="mr-4"
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <div>
                    <div className="text-2xl font-bold">{total}</div>
                    <div className="text-gray-500">总用户数</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card size="small">
                <div className="flex items-center">
                  <Avatar
                    icon={<CheckCircleOutlined />}
                    className="mr-4"
                    style={{ backgroundColor: '#52c41a' }}
                  />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.status === 'ACTIVE').length}
                    </div>
                    <div className="text-gray-500">活跃用户</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card size="small">
                <div className="flex items-center">
                  <Avatar
                    icon={<UserOutlined />}
                    className="mr-4"
                    style={{ backgroundColor: '#faad14' }}
                  />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.isAdmin).length}
                    </div>
                    <div className="text-gray-500">管理员</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card size="small">
                <div className="flex items-center">
                  <Avatar
                    icon={<CalendarOutlined />}
                    className="mr-4"
                    style={{ backgroundColor: '#722ed1' }}
                  />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => 
                        u.lastLoginTime && 
                        dayjs(u.lastLoginTime).isAfter(dayjs().subtract(7, 'day'))
                      ).length}
                    </div>
                    <div className="text-gray-500">7日内活跃</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 新增/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { pattern: /^[a-zA-Z][a-zA-Z0-9_]{3,15}$/, message: '用户名必须以字母开头，4-16位字母数字下划线' },
                ]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="employeeId"
                label="工号"
                rules={[
                  { required: true, message: '请输入工号' },
                ]}
              >
                <Input placeholder="请输入工号" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6位' },
                    { max: 20, message: '密码最多20位' },
                  ]}
                >
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="请确认密码" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[
                  { required: true, message: '请输入真实姓名' },
                  { pattern: /^[\u4e00-\u9fa5]{2,4}$|^[a-zA-Z\s]{2,20}$/, message: '请输入有效的中文姓名或英文姓名' },
                ]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性别"
                initialValue="MALE"
              >
                <Select>
                  <Select.Option value="MALE">男</Select.Option>
                  <Select.Option value="FEMALE">女</Select.Option>
                  <Select.Option value="OTHER">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="departmentId"
                label="部门"
                rules={[
                  { required: true, message: '请选择部门' },
                ]}
              >
                <Select placeholder="选择部门" allowClear>
                  {departments.map((dept) => (
                    <Select.Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="职位"
              >
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="roleIds"
            label="角色"
            rules={[
              { required: true, message: '请至少选择一个角色' },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="选择角色"
              options={roles.map(role => ({
                label: role.name,
                value: role.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="birthday"
                label="生日"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择生日"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="joinDate"
                label="入职日期"
                rules={[
                  { required: true, message: '请选择入职日期' },
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择入职日期"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="状态"
            initialValue="ACTIVE"
          >
            <Select>
              <Select.Option value="ACTIVE">正常</Select.Option>
              <Select.Option value="INACTIVE">禁用</Select.Option>
              <Select.Option value="LOCKED">锁定</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户详情抽屉 */}
      <Drawer
        title="用户详情"
        placement="right"
        width={600}
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
        extra={
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                if (selectedUser) {
                  handleEdit(selectedUser);
                  setDetailVisible(false);
                }
              }}
            >
              编辑
            </Button>
          </Space>
        }
      >
        {selectedUser && (
          <div>
            <div className="mb-6">
              <div className="flex items-center">
                <Avatar
                  src={selectedUser.avatar}
                  icon={<UserOutlined />}
                  size={64}
                  className="mr-4"
                />
                <div>
                  <div className="text-xl font-bold">{selectedUser.realName}</div>
                  <div className="text-gray-600">{selectedUser.username}</div>
                  <div className="text-gray-500 text-sm">工号: {selectedUser.employeeId}</div>
                </div>
              </div>
            </div>

            <Tabs defaultActiveKey="basic">
              <Tabs.TabPane tab="基本信息" key="basic">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="部门">
                    {selectedUser.department?.name || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="职位">
                    {selectedUser.position || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={selectedUser.status === 'ACTIVE' ? 'success' : 'error'}>
                      {selectedUser.status === 'ACTIVE' ? '正常' : selectedUser.status === 'INACTIVE' ? '禁用' : '锁定'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="角色">
                    <Space wrap>
                      {selectedUser.roles.map(role => (
                        <Tag key={role.id}>{role.name}</Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="性别">
                    {selectedUser.gender === 'MALE' ? '男' : selectedUser.gender === 'FEMALE' ? '女' : '其他'}
                  </Descriptions.Item>
                  <Descriptions.Item label="生日">
                    {selectedUser.birthday ? dayjs(selectedUser.birthday).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="入职日期">
                    {selectedUser.joinDate ? dayjs(selectedUser.joinDate).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>

              <Tabs.TabPane tab="联系信息" key="contact">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="邮箱">
                    {selectedUser.email || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="手机号">
                    {selectedUser.phone || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>

              <Tabs.TabPane tab="登录信息" key="login">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="最后登录时间">
                    {selectedUser.lastLoginTime ? dayjs(selectedUser.lastLoginTime).format('YYYY-MM-DD HH:mm:ss') : '从未登录'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录IP">
                    {selectedUser.lastLoginIp || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {dayjs(selectedUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {dayjs(selectedUser.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>

      {/* 导入用户模态框 */}
      <Modal
        title="导入用户"
        open={importVisible}
        onOk={() => importForm.submit()}
        onCancel={() => setImportVisible(false)}
        width={500}
      >
        <Form form={importForm} onFinish={handleImport} layout="vertical">
          <Form.Item
            label="选择文件"
            name="file"
            rules={[{ required: true, message: '请选择Excel文件' }]}
            extra={
              <div>
                <div className="text-gray-600 mb-2">
                  支持.xlsx格式，请下载<a href="#" onClick={() => handleExportTemplate()}>模板文件</a>
                </div>
                <div className="text-sm text-gray-500">
                  字段：用户名、密码、真实姓名、邮箱、手机号、工号、部门、职位、角色
                </div>
              </div>
            }
          >
            <Upload
              accept=".xlsx,.xls"
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
