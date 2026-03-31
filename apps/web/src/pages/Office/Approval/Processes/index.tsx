import React, { useState, useEffect } from 'react';
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
  Steps,
  Descriptions,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Switch,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '@/utils/request';
import type { ColumnsType } from 'antd/es/table';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

interface ApprovalProcess {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: '报销' | '请假' | '采购' | '人事' | '通用' | '自定义';
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stepCount: number;
  usageCount: number;
}

interface ApprovalStep {
  id: string;
  name: string;
  stepType: '审批' | '会签' | '或签' | '知会' | '条件分支';
  approvers: string[];
  conditions?: Condition[];
  formConfig?: FormConfig;
  order: number;
}

interface Condition {
  field: string;
  operator: '>' | '>=' | '<' | '<=' | '=' | '!=';
  value: any;
}

interface FormConfig {
  fields: FormField[];
  requiredFields: string[];
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  options?: string[];
  placeholder?: string;
}

const ApprovalProcessesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [processes, setProcesses] = useState<ApprovalProcess[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [designVisible, setDesignVisible] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ApprovalProcess | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<ApprovalProcess | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ApprovalStep[]>([
    {
      id: '1',
      name: '提交申请',
      stepType: '知会',
      approvers: [],
      order: 1,
    },
    {
      id: '2',
      name: '部门审批',
      stepType: '审批',
      approvers: [],
      order: 2,
    },
    {
      id: '3',
      name: '财务审批',
      stepType: '审批',
      approvers: [],
      order: 3,
    },
  ]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 初始化数据
  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockData: ApprovalProcess[] = [
        {
          id: '1',
          name: '费用报销流程',
          code: 'EXPENSE_REIMBURSEMENT',
          description: '员工费用报销审批流程',
          category: '报销',
          status: 'ACTIVE',
          version: 1,
          createdBy: '管理员',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          stepCount: 3,
          usageCount: 156,
        },
        {
          id: '2',
          name: '请假申请流程',
          code: 'LEAVE_REQUEST',
          description: '员工请假审批流程',
          category: '请假',
          status: 'ACTIVE',
          version: 1,
          createdBy: '管理员',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          stepCount: 2,
          usageCount: 89,
        },
        {
          id: '3',
          name: '采购申请流程',
          code: 'PURCHASE_REQUEST',
          description: '物品采购审批流程',
          category: '采购',
          status: 'ACTIVE',
          version: 1,
          createdBy: '管理员',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          stepCount: 4,
          usageCount: 45,
        },
        {
          id: '4',
          name: '入职审批流程',
          code: 'ONBOARDING_APPROVAL',
          description: '新员工入职审批流程',
          category: '人事',
          status: 'ACTIVE',
          version: 1,
          createdBy: '管理员',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          stepCount: 3,
          usageCount: 23,
        },
        {
          id: '5',
          name: '通用审批流程',
          code: 'GENERAL_APPROVAL',
          description: '通用事项审批流程',
          category: '通用',
          status: 'INACTIVE',
          version: 2,
          createdBy: '管理员',
          createdAt: '2024-01-01',
          updatedAt: '2024-03-01',
          stepCount: 2,
          usageCount: 12,
        },
      ];
      setProcesses(mockData);
    } catch (error) {
      message.error('获取审批流程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProcess(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'ACTIVE',
      version: 1,
      category: '通用',
    });
    setModalVisible(true);
  };

  const handleEdit = (process: ApprovalProcess) => {
    setEditingProcess(process);
    form.setFieldsValue({
      name: process.name,
      code: process.code,
      description: process.description,
      category: process.category,
      status: process.status,
      version: process.version,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 模拟API调用
      message.success('删除成功');
      fetchProcesses();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleDesign = (process: ApprovalProcess) => {
    setSelectedProcess(process);
    setDesignVisible(true);
  };

  const handlePublish = async (id: string) => {
    try {
      // 模拟发布流程
      message.success('流程发布成功');
      fetchProcesses();
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingProcess) {
        // 更新流程
        message.success('更新成功');
      } else {
        // 新增流程
        message.success('新增成功');
      }
      
      setModalVisible(false);
      fetchProcesses();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStepChange = (index: number) => {
    setCurrentStep(index);
  };

  const categoryColors: Record<string, string> = {
    报销: 'red',
    请假: 'green',
    采购: 'blue',
    人事: 'purple',
    通用: 'orange',
    自定义: 'cyan',
  };

  const columns: ColumnsType<ApprovalProcess> = [
    {
      title: '流程名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <div className="font-medium">{text}</div>
          <div className="text-gray-500 text-xs">{record.code}</div>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => (
        <Tag color={categoryColors[category] || 'default'}>{category}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>
          {status === 'ACTIVE' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
    },
    {
      title: '步骤数',
      dataIndex: 'stepCount',
      key: 'stepCount',
      width: 100,
      align: 'center',
      render: (count) => (
        <Tag color="blue">{count}</Tag>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 120,
      align: 'center',
      render: (count) => (
        <span className="font-medium">{count}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/office/approval/processes/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="设计流程">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleDesign(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === 'ACTIVE' && (
            <Tooltip title="发布">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handlePublish(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个审批流程吗？"
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
    <div className="approval-processes-page">
      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold mb-2">审批流程管理</h2>
              <p className="text-gray-600">管理系统中的审批流程配置</p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增流程
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={processes}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑流程模态框 */}
      <Modal
        title={editingProcess ? '编辑审批流程' : '新增审批流程'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="流程名称"
                rules={[
                  { required: true, message: '请输入流程名称' },
                  { max: 50, message: '流程名称不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入流程名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="流程代码"
                rules={[
                  { required: true, message: '请输入流程代码' },
                  { pattern: /^[A-Z][A-Z0-9_]*$/, message: '流程代码只能包含大写字母、数字和下划线，且必须以字母开头' },
                ]}
              >
                <Input placeholder="请输入流程代码" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="category"
            label="流程分类"
            rules={[{ required: true, message: '请选择流程分类' }]}
          >
            <Select placeholder="请选择流程分类">
              <Option value="报销">报销</Option>
              <Option value="请假">请假</Option>
              <Option value="采购">采购</Option>
              <Option value="人事">人事</Option>
              <Option value="通用">通用</Option>
              <Option value="自定义">自定义</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="流程描述"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <TextArea
              placeholder="请输入流程描述"
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="ACTIVE">启用</Option>
                  <Option value="INACTIVE">停用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本号"
                rules={[
                  { required: true, message: '请输入版本号' },
                  { type: 'number', min: 1, message: '版本号必须大于等于1' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入版本号"
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 流程设计器 */}
      <Modal
        title="流程设计器"
        open={designVisible}
        onCancel={() => setDesignVisible(false)}
        width={1200}
        footer={null}
        style={{ top: 20 }}
      >
        {selectedProcess && (
          <div className="process-designer">
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold">{selectedProcess.name}</div>
                  <div className="text-gray-600">{selectedProcess.code} - 版本 {selectedProcess.version}</div>
                </div>
                <Space>
                  <Button type="primary" icon={<CheckCircleOutlined />}>
                    保存设计
                  </Button>
                  <Button icon={<EyeOutlined />}>
                    预览流程
                  </Button>
                </Space>
              </div>
            </div>

            <Row gutter={24}>
              <Col span={18}>
                <Card title="流程设计画布" className="h-[600px]">
                  <div className="flex flex-col items-center justify-center h-full">
                    <Steps
                      current={currentStep}
                      direction="vertical"
                      size="small"
                      onChange={handleStepChange}
                      className="w-full max-w-2xl"
                    >
                      {steps.map((step, index) => (
                        <Step
                          key={step.id}
                          title={
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{step.name}</span>
                              <Tag color={
                                step.stepType === '审批' ? 'blue' :
                                step.stepType === '会签' ? 'green' :
                                step.stepType === '或签' ? 'orange' :
                                step.stepType === '知会' ? 'purple' :
                                'cyan'
                              }>
                                {step.stepType}
                              </Tag>
                            </div>
                          }
                          description={
                            <div className="mt-2">
                              <div className="text-gray-600 text-sm">
                                {step.approvers.length > 0 ? (
                                  <Space wrap>
                                    {step.approvers.map((approver, i) => (
                                      <Tag key={i} color="blue">{approver}</Tag>
                                    ))}
                                  </Space>
                                ) : (
                                  <span className="text-gray-400">暂无审批人</span>
                                )}
                              </div>
                            </div>
                          }
                        />
                      ))}
                    </Steps>
                    <Divider />
                    <Button
                      icon={<PlusOutlined />}
                      type="dashed"
                      onClick={() => {
                        const newStep: ApprovalStep = {
                          id: String(steps.length + 1),
                          name: `步骤${steps.length + 1}`,
                          stepType: '审批',
                          approvers: [],
                          order: steps.length + 1,
                        };
                        setSteps([...steps, newStep]);
                      }}
                    >
                      添加步骤
                    </Button>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card title="步骤配置" className="h-[600px]">
                  {steps.length > 0 && (
                    <div>
                      <Form layout="vertical">
                        <Form.Item label="步骤名称">
                          <Input
                            value={steps[currentStep]?.name}
                            onChange={(e) => {
                              const newSteps = [...steps];
                              newSteps[currentStep].name = e.target.value;
                              setSteps(newSteps);
                            }}
                          />
                        </Form.Item>
                        <Form.Item label="步骤类型">
                          <Select
                            value={steps[currentStep]?.stepType}
                            onChange={(value) => {
                              const newSteps = [...steps];
                              newSteps[currentStep].stepType = value;
                              setSteps(newSteps);
                            }}
                          >
                            <Option value="审批">审批</Option>
                            <Option value="会签">会签</Option>
                            <Option value="或签">或签</Option>
                            <Option value="知会">知会</Option>
                            <Option value="条件分支">条件分支</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item label="审批人">
                          <Select
                            mode="multiple"
                            placeholder="选择审批人"
                            value={steps[currentStep]?.approvers}
                            onChange={(value) => {
                              const newSteps = [...steps];
                              newSteps[currentStep].approvers = value;
                              setSteps(newSteps);
                            }}
                            options={[
                              { label: '张经理', value: '张经理' },
                              { label: '李总监', value: '李总监' },
                              { label: '王总', value: '王总' },
                              { label: '赵主管', value: '赵主管' },
                              { label: '钱主任', value: '钱主任' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item label="表单字段">
                          <Button type="dashed" block>
                            配置表单
                          </Button>
                        </Form.Item>
                        <Form.Item label="条件设置">
                          <Button type="dashed" block>
                            配置条件
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalProcessesPage;