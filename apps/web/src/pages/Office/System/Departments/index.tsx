import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Tree,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Row,
  Col,
  TreeSelect,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode, TreeProps } from 'antd/es/tree';

interface Department {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  description?: string;
  order: number;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  children?: Department[];
}

interface ManagerOption {
  id: string;
  name: string;
  title: string;
}

const DepartmentsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['root']);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  // 初始化数据
  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (departments.length > 0) {
      buildTreeData();
    }
  }, [departments]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockData: Department[] = [
        {
          id: '1',
          name: '总部',
          code: 'HQ',
          parentId: null,
          description: '公司总部',
          order: 1,
          managerId: 'admin',
          managerName: '张总',
          employeeCount: 10,
          status: 'active',
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          name: '技术部',
          code: 'TECH',
          parentId: '1',
          description: '负责技术研发',
          order: 1,
          managerId: 'tech_manager',
          managerName: '王技术总监',
          employeeCount: 45,
          status: 'active',
          createdAt: '2024-01-01',
        },
        {
          id: '3',
          name: '产品部',
          code: 'PRODUCT',
          parentId: '2',
          description: '负责产品规划',
          order: 2,
          managerId: 'product_manager',
          managerName: '李产品经理',
          employeeCount: 20,
          status: 'active',
          createdAt: '2024-01-01',
        },
        {
          id: '4',
          name: '研发部',
          code: 'RD',
          parentId: '2',
          description: '负责软件开发',
          order: 1,
          managerId: 'rd_manager',
          managerName: '赵研发经理',
          employeeCount: 25,
          status: 'active',
          createdAt: '2024-01-01',
        },
        {
          id: '5',
          name: '市场部',
          code: 'MARKET',
          parentId: '1',
          description: '负责市场营销',
          order: 2,
          managerId: 'market_manager',
          managerName: '钱市场总监',
          employeeCount: 30,
          status: 'active',
          createdAt: '2024-01-01',
        },
        {
          id: '6',
          name: '财务部',
          code: 'FINANCE',
          parentId: '1',
          description: '负责财务管理',
          order: 3,
          managerId: 'finance_manager',
          managerName: '孙财务总监',
          employeeCount: 15,
          status: 'active',
          createdAt: '2024-01-01',
        },
        {
          id: '7',
          name: '人力资源部',
          code: 'HR',
          parentId: '1',
          description: '负责人力资源管理',
          order: 4,
          managerId: 'hr_manager',
          managerName: '周HR总监',
          employeeCount: 12,
          status: 'active',
          createdAt: '2024-01-01',
        },
      ];
      setDepartments(mockData);
    } catch (error) {
      message.error('获取部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    // 模拟获取管理人员列表
    const mockManagers: ManagerOption[] = [
      { id: 'admin', name: '张总', title: '总经理' },
      { id: 'tech_manager', name: '王技术总监', title: '技术总监' },
      { id: 'product_manager', name: '李产品经理', title: '产品经理' },
      { id: 'rd_manager', name: '赵研发经理', title: '研发经理' },
      { id: 'market_manager', name: '钱市场总监', title: '市场总监' },
      { id: 'finance_manager', name: '孙财务总监', title: '财务总监' },
      { id: 'hr_manager', name: '周HR总监', title: 'HR总监' },
    ];
    setManagers(mockManagers);
  };

  const buildTreeData = () => {
    const deptMap = new Map<string, DataNode>();
    const rootNodes: DataNode[] = [];

    // 创建所有节点的映射
    departments.forEach(dept => {
      deptMap.set(dept.id, {
        key: dept.id,
        title: (
          <div className="flex items-center justify-between">
            <span>{dept.name}</span>
            <Space size={4}>
              <Tag color="blue">{dept.code}</Tag>
              {dept.employeeCount > 0 && (
                <Tag color="green">{dept.employeeCount}人</Tag>
              )}
            </Space>
          </div>
        ),
        children: [],
        isLeaf: true,
      });
    });

    // 构建树结构
    departments.forEach(dept => {
      const node = deptMap.get(dept.id)!;
      
      if (dept.parentId && deptMap.has(dept.parentId)) {
        const parentNode = deptMap.get(dept.parentId)!;
        parentNode.children!.push(node);
        parentNode.isLeaf = false;
      } else {
        rootNodes.push(node);
      }
    });

    setTreeData(rootNodes);
  };

  const handleAdd = () => {
    setEditingDept(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', order: 0 });
    setModalVisible(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    form.setFieldsValue({
      name: dept.name,
      code: dept.code,
      parentId: dept.parentId || undefined,
      description: dept.description,
      order: dept.order,
      managerId: dept.managerId,
      status: dept.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 检查是否有子部门
      const hasChildren = departments.some(dept => dept.parentId === id);
      if (hasChildren) {
        message.warning('该部门下存在子部门，请先处理子部门');
        return;
      }

      // 模拟API调用
      message.success('删除成功');
      fetchDepartments();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingDept) {
        // 更新部门
        message.success('更新成功');
      } else {
        // 新增部门
        message.success('新增成功');
      }
      
      setModalVisible(false);
      fetchDepartments();
    } catch (error) {
      console.error(error);
    }
  };

  const handleTreeExpand = (keys: string[]) => {
    setExpandedKeys(keys);
    setAutoExpandParent(false);
  };

  const onTreeSelect: TreeProps['onSelect'] = (selectedKeys) => {
    console.log('selected', selectedKeys);
  };

  const columns: ColumnsType<Department> = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          <ApartmentOutlined />
          <span>{text}</span>
          <Tag color="blue">{record.code}</Tag>
        </Space>
      ),
    },
    {
      title: '部门路径',
      key: 'path',
      render: (_, record) => {
        const getPath = (dept: Department): string => {
          if (!dept.parentId) return dept.name;
          
          const parent = departments.find(d => d.id === dept.parentId);
          if (!parent) return dept.name;
          
          return `${getPath(parent)} / ${dept.name}`;
        };
        
        return <span className="text-gray-600">{getPath(record)}</span>;
      },
    },
    {
      title: '负责人',
      dataIndex: 'managerName',
      key: 'managerName',
      render: (text, record) => (
        text ? (
          <Space>
            <TeamOutlined />
            <span>{text}</span>
          </Space>
        ) : <span className="text-gray-400">未指定</span>
      ),
    },
    {
      title: '员工数量',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'}>{count}人</Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
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
              title="确定要删除这个部门吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="departments-page">
      <Row gutter={16}>
        <Col span={8}>
          <Card
            title="部门结构"
            className="mb-6"
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => setExpandedKeys(['root'])}
              >
                全部展开
              </Button>
            }
          >
            <div style={{ height: '600px', overflow: 'auto' }}>
              <Tree
                treeData={treeData}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onExpand={handleTreeExpand}
                onSelect={onTreeSelect}
                showLine
                showIcon
                defaultExpandAll
              />
            </div>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card>
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold mb-2">部门列表</h2>
                  <p className="text-gray-600">管理系统中的部门结构</p>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  新增部门
                </Button>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={departments}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 新增/编辑部门模态框 */}
      <Modal
        title={editingDept ? '编辑部门' : '新增部门'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="部门名称"
                rules={[
                  { required: true, message: '请输入部门名称' },
                  { max: 50, message: '部门名称不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入部门名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="部门代码"
                rules={[
                  { required: true, message: '请输入部门代码' },
                  { pattern: /^[A-Z0-9_]+$/, message: '部门代码只能包含大写字母、数字和下划线' },
                ]}
              >
                <Input placeholder="请输入部门代码" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="parentId"
            label="上级部门"
          >
            <TreeSelect
              treeData={[
                {
                  title: '无上级部门',
                  value: null,
                  key: 'root',
                },
                ...departments.map(dept => ({
                  title: dept.name,
                  value: dept.id,
                  key: dept.id,
                })),
              ]}
              placeholder="请选择上级部门"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="部门描述"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入部门描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="managerId"
                label="部门负责人"
              >
                <Select
                  placeholder="请选择部门负责人"
                  allowClear
                  options={managers.map(m => ({
                    label: `${m.name} (${m.title})`,
                    value: m.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order"
                label="排序序号"
                rules={[
                  { required: true, message: '请输入排序序号' },
                  { type: 'number', min: 0, max: 999 },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入排序序号"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择状态"
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;