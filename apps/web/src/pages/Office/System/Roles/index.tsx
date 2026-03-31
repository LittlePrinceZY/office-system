import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Badge,
  Divider,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import type { ColumnsType } from 'antd/es/table';

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
  userCount: number;
}

interface PermissionGroup {
  title: string;
  key: string;
  children: PermissionItem[];
}

interface PermissionItem {
  title: string;
  key: string;
  value: string;
}

const RolesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const { user } = useAuthStore();

  // 权限分组数据
  const permissionGroups: PermissionGroup[] = [
    {
      title: '系统管理',
      key: 'system',
      children: [
        { title: '用户管理', key: 'users', value: 'system:users' },
        { title: '角色管理', key: 'roles', value: 'system:roles' },
        { title: '部门管理', key: 'departments', value: 'system:departments' },
        { title: '系统配置', key: 'config', value: 'system:config' },
      ],
    },
    {
      title: '办公应用',
      key: 'office',
      children: [
        { title: '审批管理', key: 'approvals', value: 'office:approvals' },
        { title: '公告管理', key: 'notices', value: 'office:notices' },
        { title: '报销管理', key: 'expenses', value: 'office:expenses' },
        { title: '通讯录', key: 'contacts', value: 'office:contacts' },
        { title: '聊天系统', key: 'chat', value: 'office:chat' },
      ],
    },
    {
      title: '客户管理',
      key: 'crm',
      children: [
        { title: '客户管理', key: 'customers', value: 'crm:customers' },
        { title: '联系人管理', key: 'contacts', value: 'crm:contacts' },
        { title: '销售机会', key: 'opportunities', value: 'crm:opportunities' },
        { title: '合同管理', key: 'contracts', value: 'crm:contracts' },
      ],
    },
    {
      title: '数据权限',
      key: 'data',
      children: [
        { title: '查看所有数据', key: 'viewAll', value: 'data:viewAll' },
        { title: '编辑所有数据', key: 'editAll', value: 'data:editAll' },
        { title: '删除所有数据', key: 'deleteAll', value: 'data:deleteAll' },
        { title: '部门数据权限', key: 'department', value: 'data:department' },
      ],
    },
  ];

  // 初始化数据
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockData: Role[] = [
        {
          id: '1',
          name: '超级管理员',
          code: 'super_admin',
          description: '系统最高权限管理员',
          permissions: ['system:users', 'system:roles', 'system:departments', 'system:config', 'office:approvals', 'office:notices', 'office:expenses', 'office:contacts', 'office:chat', 'crm:customers', 'data:viewAll', 'data:editAll', 'data:deleteAll'],
          isDefault: false,
          createdAt: '2024-01-01',
          userCount: 1,
        },
        {
          id: '2',
          name: '管理员',
          code: 'admin',
          description: '企业管理员',
          permissions: ['system:users', 'system:departments', 'office:approvals', 'office:notices', 'office:expenses', 'office:contacts', 'crm:customers', 'data:viewAll', 'data:editAll'],
          isDefault: false,
          createdAt: '2024-01-01',
          userCount: 5,
        },
        {
          id: '3',
          name: '部门经理',
          code: 'manager',
          description: '部门负责人',
          permissions: ['office:approvals', 'office:notices', 'office:expenses', 'office:contacts', 'crm:customers', 'data:department'],
          isDefault: false,
          createdAt: '2024-01-01',
          userCount: 12,
        },
        {
          id: '4',
          name: '普通员工',
          code: 'employee',
          description: '普通员工权限',
          permissions: ['office:contacts', 'office:chat', 'crm:customers'],
          isDefault: true,
          createdAt: '2024-01-01',
          userCount: 156,
        },
      ];
      setRoles(mockData);
    } catch (error) {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      code: role.code,
      description: role.description,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 模拟API调用
      message.success('删除成功');
      fetchRoles();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    permissionForm.setFieldsValue({
      permissions: role.permissions,
    });
    setPermissionModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRole) {
        // 更新角色
        message.success('更新成功');
      } else {
        // 新增角色
        message.success('新增成功');
      }
      
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePermissionSubmit = async () => {
    try {
      const values = await permissionForm.validateFields();
      // 更新角色权限
      message.success('权限更新成功');
      setPermissionModalVisible(false);
      fetchRoles();
    } catch (error) {
      console.error(error);
    }
  };

  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.isDefault && <Tag color="blue">默认</Tag>}
        </Space>
      ),
    },
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '权限数量',
      key: 'permissionCount',
      render: (_, record) => (
        <Badge count={record.permissions.length} showZero />
      ),
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => (
        <Space>
          <UserOutlined />
          <span>{count}</span>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.isDefault}
            />
          </Tooltip>
          <Tooltip title="权限配置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleManagePermissions(record)}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {/* 查看详情 */}}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个角色吗？"
              onConfirm={() => handleDelete(record.id)}
              disabled={record.isDefault}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={record.isDefault}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="roles-page">
      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold mb-2">角色管理</h2>
              <p className="text-gray-600">管理系统中的角色和权限配置</p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增角色
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑角色模态框 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[
              { required: true, message: '请输入角色名称' },
              { max: 50, message: '角色名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="角色代码"
            rules={[
              { required: true, message: '请输入角色代码' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '角色代码只能包含字母、数字和下划线，且不能以数字开头' },
            ]}
          >
            <Input placeholder="请输入角色代码（英文）" />
          </Form.Item>

          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入角色描述"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限配置模态框 */}
      <Modal
        title="权限配置"
        open={permissionModalVisible}
        onOk={handlePermissionSubmit}
        onCancel={() => setPermissionModalVisible(false)}
        width={800}
      >
        {selectedRole && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="font-medium">当前角色：{selectedRole.name}</div>
              <div className="text-gray-600 text-sm">{selectedRole.code}</div>
            </div>

            <Form
              form={permissionForm}
              layout="vertical"
            >
              {permissionGroups.map((group) => (
                <div key={group.key} className="mb-6">
                  <Divider orientation="left">{group.title}</Divider>
                  <Form.Item
                    name="permissions"
                    label={null}
                    valuePropName="checked"
                  >
                    <Select
                      mode="multiple"
                      placeholder={`选择${group.title}权限`}
                      style={{ width: '100%' }}
                      dropdownRender={() => (
                        <div className="p-2">
                          {group.children.map((permission) => (
                            <div key={permission.key} className="mb-2">
                              <Form.Item
                                name="permissions"
                                valuePropName="checked"
                                noStyle
                              >
                                <Select.Option value={permission.value}>
                                  {permission.title}
                                </Select.Option>
                              </Form.Item>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </Form.Item>
                </div>
              ))}
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RolesPage;