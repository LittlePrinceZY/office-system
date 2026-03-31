import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import * as XLSX from 'xlsx';
import ReactEChartsCore from 'react-echarts-core';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必要的echarts组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  Typography,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Upload,
  message,
  Popconfirm,
  Dropdown,
  Menu,
  Descriptions,
  Divider,
  Progress,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DollarOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
  DownloadOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../stores/auth';
import request from '../../../utils/request';
import dayjs from 'dayjs';
import './style.css';
import ReimbursementDetailPage from './Detail';

const { Title, Text } = Typography;

interface Reimbursement {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  createdAt: string;
  attachments: string[];
  applicant?: { 
    id: string;
    realName: string;
    avatar?: string;
    department?: { name: string };
  };
  approverId?: string;
  approvedAt?: string;
  comment?: string;
}

interface ApprovalModalProps {
  visible: boolean;
  reimbursementId: string;
  type: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: () => void;
}

const ReimbursementList: React.FC<{ type: 'my' | 'pending' }> = ({ type }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvalModal, setApprovalModal] = useState<{
    visible: boolean;
    reimbursementId: string;
    type: 'approve' | 'reject';
  }>({
    visible: false,
    reimbursementId: '',
    type: 'approve',
  });

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'my' ? '/finance/reimbursements/my' : '/finance/reimbursements/pending';
      const result = await request.get(endpoint);
      setData(result.list);
    } catch (error) {
      console.error('获取报销列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (id: string) => {
    navigate(`/office/finance/detail/${id}`);
  };

  const handleApprove = (id: string) => {
    setApprovalModal({
      visible: true,
      reimbursementId: id,
      type: 'approve',
    });
  };

  const handleReject = (id: string) => {
    setApprovalModal({
      visible: true,
      reimbursementId: id,
      type: 'reject',
    });
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await request.post(`/finance/reimbursements/${id}/pay`);
      message.success('已标记为已付款');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleApprovalSuccess = () => {
    fetchData();
  };

  const handleApprovalClose = () => {
    setApprovalModal({
      visible: false,
      reimbursementId: '',
      type: 'approve',
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="processing">待审批</Tag>;
      case 'APPROVED':
        return <Tag color="success">已通过</Tag>;
      case 'REJECTED':
        return <Tag color="error">已驳回</Tag>;
      case 'PAID':
        return <Tag color="default">已付款</Tag>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      TRAVEL: '差旅费',
      MEAL: '餐费',
      OFFICE: '办公费',
      ENTERTAINMENT: '招待费',
      OTHER: '其他',
    };
    return types[type] || type;
  };

  const columns = [
    {
      title: '报销类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeLabel(type),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
  ];

  // 为待审批列表添加审批操作列
  if (type === 'pending') {
    columns.push({
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      render: (applicant: { realName: string }) => applicant?.realName,
    } as any);
    
    columns.push({
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record: Reimbursement) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
          >
            批准
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id)}
          >
            驳回
          </Button>
        </Space>
      ),
    } as any);
  }

  // 为我的报销列表添加操作列
  if (type === 'my') {
    columns.push({
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: Reimbursement) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {record.status === 'APPROVED' && (
            <Popconfirm
              title="确认标记为已付款？"
              onConfirm={() => handleMarkAsPaid(record.id)}
            >
              <Button
                type="text"
                size="small"
                icon={<DollarOutlined />}
              >
                标记付款
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    } as any);
  }

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {type === 'my' && <CreateReimbursement />}
        </div>
        <div>
          <ExportButton type={type} data={data} />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <ApprovalModal
        visible={approvalModal.visible}
        reimbursementId={approvalModal.reimbursementId}
        type={approvalModal.type}
        onClose={handleApprovalClose}
        onSuccess={handleApprovalSuccess}
      />
    </>
  );
};

const FinanceStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchStats();
    fetchMonthlyStats();
  }, [year]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await request.get('/finance/statistics');
      setStats(data);
    } catch (error) {
      console.error('获取统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const data = await request.get(`/finance/statistics/monthly?year=${year}`);
      setMonthlyStats(data);
    } catch (error) {
      console.error('获取月度统计失败:', error);
    }
  };

  const getStatusChartOption = () => {
    if (!stats) return {};

    return {
      title: {
        text: '报销状态分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '报销状态',
          type: 'pie',
          radius: '50%',
          data: [
            { value: stats.pendingCount, name: '待审批' },
            { value: stats.approvedCount, name: '已通过' },
            { value: stats.rejectedCount || 0, name: '已驳回' },
            { value: stats.paidCount || 0, name: '已付款' },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  const getTypeChartOption = () => {
    if (!stats || !stats.byType) return {};

    return {
      title: {
        text: '报销类型分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: stats.byType.map((item: any) => {
          const typeMap: Record<string, string> = {
            TRAVEL: '差旅费',
            MEAL: '餐费',
            OFFICE: '办公费',
            ENTERTAINMENT: '招待费',
            OTHER: '其他',
          };
          return typeMap[item.type] || item.type;
        }),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '数量',
          type: 'bar',
          data: stats.byType.map((item: any) => item.count),
          itemStyle: {
            color: '#1890ff',
          },
        },
        {
          name: '金额',
          type: 'bar',
          data: stats.byType.map((item: any) => item.amount),
          itemStyle: {
            color: '#52c41a',
          },
        },
      ],
    };
  };

  const getMonthlyChartOption = () => {
    if (!monthlyStats || monthlyStats.length === 0) return {};

    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    return {
      title: {
        text: `${year}年度月度报销统计`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['报销数量', '报销金额'],
        top: '10%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
      },
      yAxis: [
        {
          type: 'value',
          name: '数量',
          position: 'left',
        },
        {
          type: 'value',
          name: '金额',
          position: 'right',
        },
      ],
      series: [
        {
          name: '报销数量',
          type: 'line',
          yAxisIndex: 0,
          data: monthlyStats.map((item: any) => item.count),
          smooth: true,
          lineStyle: {
            width: 3,
          },
        },
        {
          name: '报销金额',
          type: 'line',
          yAxisIndex: 1,
          data: monthlyStats.map((item: any) => item.amount),
          smooth: true,
          lineStyle: {
            width: 3,
          },
        },
      ],
    };
  };

  if (!stats) return null;

  return (
    <div style={{ padding: '0 16px' }}>
      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总报销数"
              value={stats.totalCount}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审批"
              value={stats.pendingCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已通过"
              value={stats.approvedCount}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="报销总额"
              value={stats.totalAmount}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="报销状态分布" style={{ height: 400 }}>
            <ReactEChartsCore
              echarts={echarts}
              option={getStatusChartOption()}
              style={{ height: '320px', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="报销类型分布" style={{ height: 400 }}>
            <ReactEChartsCore
              echarts={echarts}
              option={getTypeChartOption()}
              style={{ height: '320px', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </Card>
        </Col>
        <Col xs={24}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>月度报销统计</span>
                <Select
                  value={year}
                  style={{ width: 120 }}
                  onChange={(value) => setYear(value)}
                  options={[
                    { label: '2025年', value: 2025 },
                    { label: '2026年', value: 2026 },
                    { label: '2027年', value: 2027 },
                  ]}
                />
              </div>
            }
            style={{ height: 500 }}
          >
            <ReactEChartsCore
              echarts={echarts}
              option={getMonthlyChartOption()}
              style={{ height: '400px', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 导出功能组件
const ExportButton: React.FC<{ type: 'my' | 'pending'; data: Reimbursement[] }> = ({ type, data }) => {
  const [exporting, setExporting] = useState(false);

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      TRAVEL: '差旅费',
      MEAL: '餐费',
      OFFICE: '办公费',
      ENTERTAINMENT: '招待费',
      OTHER: '其他',
    };
    return types[type] || type;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return '待审批';
      case 'APPROVED': return '已通过';
      case 'REJECTED': return '已驳回';
      case 'PAID': return '已付款';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD');
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      message.warning('没有数据可以导出');
      return;
    }

    setExporting(true);
    try {
      // 准备导出数据
      const exportData = data.map((item, index) => {
        const row: any = {
          序号: index + 1,
          报销类型: getTypeLabel(item.type),
          金额: `¥${item.amount.toFixed(2)}`,
          日期: formatDate(item.date),
          说明: item.description,
          状态: getStatusLabel(item.status),
          申请时间: dayjs(item.createdAt).format('YYYY-MM-DD HH:mm'),
        };

        if (type === 'pending') {
          row.申请人 = item.applicant?.realName || '';
          row.部门 = item.applicant?.department?.name || '';
        }

        return row;
      });

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // 设置列宽
      const colWidths = [
        { wch: 8 },  // 序号
        { wch: 12 }, // 报销类型
        { wch: 15 }, // 金额
        { wch: 12 }, // 日期
        { wch: 30 }, // 说明
        { wch: 10 }, // 状态
        { wch: 18 }, // 申请时间
      ];
      
      if (type === 'pending') {
        colWidths.push({ wch: 10 }); // 申请人
        colWidths.push({ wch: 15 }); // 部门
      }
      
      ws['!cols'] = colWidths;
      
      // 添加工作表到工作簿
      const sheetName = type === 'my' ? '我的报销' : '待审批报销';
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // 生成Excel文件
      const fileName = `${sheetName}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="default"
      icon={<DownloadOutlined />}
      onClick={handleExport}
      loading={exporting}
      disabled={!data || data.length === 0}
    >
      导出Excel
    </Button>
  );
};

// 审批操作模态框
const ApprovalModal: React.FC<ApprovalModalProps> = ({
  visible,
  reimbursementId,
  type,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await request.post(`/finance/reimbursements/${reimbursementId}/approve`, {
        status: type === 'approve' ? 'APPROVED' : 'REJECTED',
        comment: values.comment || '',
      });
      message.success(type === 'approve' ? '报销已批准' : '报销已驳回');
      onSuccess();
      onClose();
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = type === 'approve' ? '批准报销申请' : '驳回报销申请';
  const buttonText = type === 'approve' ? '批准' : '驳回';
  const buttonType = type === 'approve' ? 'primary' : 'danger';

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ comment: '' }}
      >
        <Form.Item
          name="comment"
          label="审批意见"
          rules={[{ required: type === 'reject', message: '请填写驳回理由' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder={type === 'approve' ? '请输入批准意见（可选）' : '请输入驳回理由'}
          />
        </Form.Item>
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>取消</Button>
            <Button type={buttonType} htmlType="submit" loading={loading}>
              {buttonText}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const CreateReimbursement: React.FC = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      await request.post('/finance/reimbursements', {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      });
      message.success('报销申请提交成功');
      setVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('提交失败');
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setVisible(true)}>
        新建报销
      </Button>

      <Modal
        title="新建报销申请"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="type"
            label="报销类型"
            rules={[{ required: true, message: '请选择报销类型' }]}
          >
            <Select
              options={[
                { label: '差旅费', value: 'TRAVEL' },
                { label: '餐费', value: 'MEAL' },
                { label: '办公费', value: 'OFFICE' },
                { label: '招待费', value: 'ENTERTAINMENT' },
                { label: '其他', value: 'OTHER' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              prefix="¥"
              min={0.01}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="说明"
            rules={[{ required: true, message: '请输入说明' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述报销事由..." />
          </Form.Item>
          <Form.Item name="attachments" label="附件">
            <Upload>
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Finance: React.FC = () => {
  const { user } = useAuthStore();

  const items = [
    {
      key: 'my',
      label: '我的报销',
      children: <ReimbursementList type="my" />,
    },
    {
      key: 'pending',
      label: '报销审批',
      children: <ReimbursementList type="pending" />,
    },
    {
      key: 'statistics',
      label: '统计报表',
      children: <FinanceStats />,
    },
  ];

  // 非管理员不显示审批和统计
  const filteredItems = user?.isAdmin ? items : items.filter((item) => item.key === 'my');

  return (
    <div className="finance-page">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          财务报销
        </Title>
      </div>

      <Card className="finance-card">
        <Tabs items={filteredItems} defaultActiveKey="my" />
      </Card>
    </div>
  );
};

// Finance路由容器组件
const FinanceRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Finance />} />
      <Route path="detail/:id" element={<ReimbursementDetailPage />} />
    </Routes>
  );
};

export default FinanceRoutes;

export default Finance;
