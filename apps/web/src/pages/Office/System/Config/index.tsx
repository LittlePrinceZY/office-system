import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Space,
  Tag,
  Divider,
  message,
  Tabs,
  Row,
  Col,
  Typography,
  Upload,
  ColorPicker,
  Radio,
  TimePicker,
} from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  UploadOutlined,
  SettingOutlined,
  GlobalOutlined,
  SecurityScanOutlined,
  NotificationOutlined,
  MailOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface ConfigItem {
  key: string;
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'time';
  description?: string;
  options?: { label: string; value: any }[];
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface ConfigGroup {
  key: string;
  name: string;
  icon: React.ReactNode;
  items: ConfigItem[];
}

const ConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configGroups, setConfigGroups] = useState<ConfigGroup[]>([]);
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  // 初始化配置数据
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockGroups: ConfigGroup[] = [
        {
          key: 'basic',
          name: '基础设置',
          icon: <SettingOutlined />,
          items: [
            {
              key: 'system_name',
              name: '系统名称',
              value: '企业办公系统',
              type: 'string',
              description: '显示在浏览器标题和登录页面的系统名称',
              placeholder: '请输入系统名称',
              required: true,
            },
            {
              key: 'system_version',
              name: '系统版本',
              value: '1.0.0',
              type: 'string',
              description: '当前系统版本号',
              placeholder: '请输入版本号',
            },
            {
              key: 'company_name',
              name: '公司名称',
              value: 'XX科技有限公司',
              type: 'string',
              description: '公司全称',
              placeholder: '请输入公司名称',
              required: true,
            },
            {
              key: 'copyright',
              name: '版权信息',
              value: '© 2024 XX科技有限公司 版权所有',
              type: 'string',
              description: '页面底部显示的版权信息',
              placeholder: '请输入版权信息',
            },
            {
              key: 'login_background',
              name: '登录背景',
              value: 'default',
              type: 'select',
              description: '登录页面背景样式',
              options: [
                { label: '默认背景', value: 'default' },
                { label: '渐变背景', value: 'gradient' },
                { label: '图片背景', value: 'image' },
                { label: '视频背景', value: 'video' },
              ],
            },
            {
              key: 'theme_color',
              name: '主题色',
              value: '#1890ff',
              type: 'color',
              description: '系统主题颜色',
            },
          ],
        },
        {
          key: 'security',
          name: '安全设置',
          icon: <SecurityScanOutlined />,
          items: [
            {
              key: 'password_min_length',
              name: '密码最小长度',
              value: 8,
              type: 'number',
              description: '用户密码最小长度要求',
              min: 6,
              max: 32,
              step: 1,
            },
            {
              key: 'password_complexity',
              name: '密码复杂度',
              value: 'medium',
              type: 'select',
              description: '密码复杂度要求',
              options: [
                { label: '低（仅字母）', value: 'low' },
                { label: '中（字母+数字）', value: 'medium' },
                { label: '高（字母+数字+特殊字符）', value: 'high' },
              ],
            },
            {
              key: 'login_attempts',
              name: '最大登录尝试次数',
              value: 5,
              type: 'number',
              description: '密码错误最大尝试次数，超过将锁定账户',
              min: 1,
              max: 10,
              step: 1,
            },
            {
              key: 'session_timeout',
              name: '会话超时时间（分钟）',
              value: 30,
              type: 'number',
              description: '用户无操作后自动登出的时间',
              min: 5,
              max: 1440,
              step: 5,
            },
            {
              key: 'enable_two_factor',
              name: '启用双因素认证',
              value: false,
              type: 'boolean',
              description: '是否启用双因素认证（2FA）',
            },
            {
              key: 'ip_whitelist',
              name: 'IP白名单',
              value: '',
              type: 'string',
              description: '允许访问系统的IP地址，多个用逗号分隔，留空表示不限制',
              placeholder: '192.168.1.1, 10.0.0.1',
            },
          ],
        },
        {
          key: 'notification',
          name: '通知设置',
          icon: <NotificationOutlined />,
          items: [
            {
              key: 'email_enabled',
              name: '启用邮件通知',
              value: true,
              type: 'boolean',
              description: '是否启用邮件通知功能',
            },
            {
              key: 'sms_enabled',
              name: '启用短信通知',
              value: false,
              type: 'boolean',
              description: '是否启用短信通知功能',
            },
            {
              key: 'push_enabled',
              name: '启用推送通知',
              value: true,
              type: 'boolean',
              description: '是否启用浏览器推送通知',
            },
            {
              key: 'notification_work_time',
              name: '工作时间',
              value: '09:00-18:00',
              type: 'string',
              description: '发送非紧急通知的工作时间范围',
              placeholder: '09:00-18:00',
            },
            {
              key: 'urgent_notification',
              name: '紧急通知方式',
              value: 'all',
              type: 'select',
              description: '紧急通知的发送方式',
              options: [
                { label: '所有方式', value: 'all' },
                { label: '仅邮件', value: 'email' },
                { label: '仅短信', value: 'sms' },
                { label: '邮件+短信', value: 'email_sms' },
              ],
            },
          ],
        },
        {
          key: 'email',
          name: '邮件设置',
          icon: <MailOutlined />,
          items: [
            {
              key: 'smtp_host',
              name: 'SMTP服务器',
              value: 'smtp.example.com',
              type: 'string',
              description: 'SMTP服务器地址',
              placeholder: 'smtp.example.com',
              required: true,
            },
            {
              key: 'smtp_port',
              name: 'SMTP端口',
              value: 587,
              type: 'number',
              description: 'SMTP服务器端口',
              min: 1,
              max: 65535,
              step: 1,
            },
            {
              key: 'smtp_username',
              name: 'SMTP用户名',
              value: 'noreply@example.com',
              type: 'string',
              description: 'SMTP认证用户名',
              placeholder: 'username',
            },
            {
              key: 'smtp_password',
              name: 'SMTP密码',
              value: '',
              type: 'string',
              description: 'SMTP认证密码',
              placeholder: 'password',
            },
            {
              key: 'smtp_ssl',
              name: '启用SSL',
              value: true,
              type: 'boolean',
              description: '是否启用SSL加密',
            },
            {
              key: 'sender_name',
              name: '发件人名称',
              value: '企业办公系统',
              type: 'string',
              description: '邮件发件人显示名称',
              placeholder: '企业办公系统',
            },
            {
              key: 'sender_email',
              name: '发件人邮箱',
              value: 'noreply@example.com',
              type: 'string',
              description: '邮件发件人邮箱地址',
              placeholder: 'noreply@example.com',
              required: true,
            },
          ],
        },
        {
          key: 'file',
          name: '文件设置',
          icon: <FileTextOutlined />,
          items: [
            {
              key: 'upload_max_size',
              name: '最大上传大小（MB）',
              value: 50,
              type: 'number',
              description: '单个文件最大上传大小',
              min: 1,
              max: 1024,
              step: 1,
            },
            {
              key: 'allowed_extensions',
              name: '允许的文件类型',
              value: 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar',
              type: 'string',
              description: '允许上传的文件扩展名，多个用逗号分隔',
              placeholder: 'jpg,png,pdf,doc',
            },
            {
              key: 'storage_type',
              name: '存储类型',
              value: 'local',
              type: 'select',
              description: '文件存储方式',
              options: [
                { label: '本地存储', value: 'local' },
                { label: '阿里云OSS', value: 'aliyun' },
                { label: '腾讯云COS', value: 'tencent' },
                { label: 'AWS S3', value: 'aws' },
              ],
            },
            {
              key: 'image_compress',
              name: '图片压缩',
              value: true,
              type: 'boolean',
              description: '是否自动压缩上传的图片',
            },
            {
              key: 'image_quality',
              name: '图片质量',
              value: 80,
              type: 'number',
              description: '图片压缩质量（0-100）',
              min: 0,
              max: 100,
              step: 5,
            },
          ],
        },
        {
          key: 'system',
          name: '系统设置',
          icon: <GlobalOutlined />,
          items: [
            {
              key: 'timezone',
              name: '时区设置',
              value: 'Asia/Shanghai',
              type: 'select',
              description: '系统时区',
              options: [
                { label: '北京/上海 (GMT+8)', value: 'Asia/Shanghai' },
                { label: '东京 (GMT+9)', value: 'Asia/Tokyo' },
                { label: '纽约 (GMT-5)', value: 'America/New_York' },
                { label: '伦敦 (GMT+0)', value: 'Europe/London' },
              ],
            },
            {
              key: 'date_format',
              name: '日期格式',
              value: 'YYYY-MM-DD',
              type: 'select',
              description: '系统日期显示格式',
              options: [
                { label: '2024-01-01', value: 'YYYY-MM-DD' },
                { label: '01/01/2024', value: 'MM/DD/YYYY' },
                { label: '2024年01月01日', value: 'YYYY年MM月DD日' },
              ],
            },
            {
              key: 'time_format',
              name: '时间格式',
              value: 'HH:mm:ss',
              type: 'select',
              description: '系统时间显示格式',
              options: [
                { label: '14:30:00 (24小时制)', value: 'HH:mm:ss' },
                { label: '02:30:00 PM (12小时制)', value: 'hh:mm:ss A' },
              ],
            },
            {
              key: 'language',
              name: '默认语言',
              value: 'zh-CN',
              type: 'select',
              description: '系统默认语言',
              options: [
                { label: '简体中文', value: 'zh-CN' },
                { label: 'English', value: 'en-US' },
                { label: '日本語', value: 'ja-JP' },
              ],
            },
            {
              key: 'enable_auto_backup',
              name: '启用自动备份',
              value: true,
              type: 'boolean',
              description: '是否启用系统自动备份',
            },
            {
              key: 'backup_time',
              name: '备份时间',
              value: '02:00',
              type: 'time',
              description: '每日自动备份的时间',
            },
            {
              key: 'keep_backup_days',
              name: '备份保留天数',
              value: 30,
              type: 'number',
              description: '自动备份文件保留天数',
              min: 1,
              max: 365,
              step: 1,
            },
          ],
        },
      ];

      setConfigGroups(mockGroups);
      
      // 设置表单初始值
      const initialValues: Record<string, any> = {};
      mockGroups.forEach(group => {
        group.items.forEach(item => {
          initialValues[item.key] = item.value;
        });
      });
      form.setFieldsValue(initialValues);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // 模拟API调用
      console.log('保存配置:', values);
      
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('配置保存成功');
    } catch (error) {
      console.error(error);
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    fetchConfig(); // 重新加载原始配置
    message.info('已重置配置');
  };

  const renderFormItem = (item: ConfigItem) => {
    const rules = [];
    if (item.required) {
      rules.push({ required: true, message: `请输入${item.name}` });
    }

    switch (item.type) {
      case 'string':
        return (
          <Form.Item
            key={item.key}
            name={item.key}
            label={item.name}
            rules={rules}
            extra={item.description}
          >
            <Input
              placeholder={item.placeholder || `请输入${item.name}`}
              allowClear
            />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            key={item.key}
            name={item.key}
            label={item.name}
            rules={[
              ...rules,
              { type: 'number', min: item.min, max: item.max },
            ]}
            extra={item.description}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={item.placeholder || `请输入${item.name}`}
              min={item.min}
              max={item.max}
              step={item.step}
            />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item
            key={item.key}
            name={item.key}
            label={item.name}
            valuePropName="checked"
            extra={item.description}
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item
            key={item.key}
            name={item.key}
            label={item.name}
            rules={rules}
            extra={item.description}
          >
            <Select
              placeholder={item.placeholder || `请选择${item.name}`}
              options={item.options}
              allowClear
            />
          </Form.Item>
        );

      case 'color':
        return (
          <Form.Item
            key={item.key}
            name={item.key}
            label={item.name}
            rules={rules}
            extra={item.description}
          >
            <ColorPicker
              showText
              format="hex"
              presets={[
                {
                  label: '推荐颜色',
                  colors: [
                    '#1890ff',
                    '#52c41a',
                    '#faad14',
                    '#f5222d',
                    '#722ed1',
                    '#13c2c2',
                    '#eb2f96',
                  ],
                },
              ]}
            />
          </Form.Item>
        );

      case 'time':
        return (
          <Form.Item
            key={item.key}
            name={item.key}
            label={item.name}
            rules={rules}
            extra={item.description}
          >
            <TimePicker
              format="HH:mm"
              style={{ width: '100%' }}
              placeholder="请选择时间"
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <div className="config-page">
      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <Title level={4} className="mb-2">
                <SettingOutlined className="mr-2" />
                系统配置
              </Title>
              <Text type="secondary">
                管理系统各项配置参数，修改后请保存生效
              </Text>
            </div>
            <Space>
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={loading || saving}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
              >
                保存配置
              </Button>
            </Space>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          disabled={loading}
        >
          <Tabs defaultActiveKey="basic" type="card">
            {configGroups.map(group => (
              <TabPane
                key={group.key}
                tab={
                  <span>
                    {group.icon}
                    <span className="ml-2">{group.name}</span>
                  </span>
                }
              >
                <Row gutter={[24, 16]}>
                  {group.items.map((item, index) => (
                    <Col
                      key={item.key}
                      xs={24}
                      sm={24}
                      md={12}
                      lg={12}
                      xl={8}
                    >
                      {renderFormItem(item)}
                    </Col>
                  ))}
                </Row>
              </TabPane>
            ))}
          </Tabs>
        </Form>

        <Divider />

        <div className="mt-8">
          <Title level={5}>配置说明</Title>
          <ul className="text-gray-600 space-y-2">
            <li>
              • 基础设置：修改系统名称、公司信息、主题颜色等基础配置
            </li>
            <li>
              • 安全设置：配置密码策略、登录限制、会话超时等安全相关参数
            </li>
            <li>
              • 通知设置：配置系统通知方式、工作时间等
            </li>
            <li>
              • 邮件设置：配置SMTP服务器信息，用于发送系统邮件
            </li>
            <li>
              • 文件设置：配置文件上传大小限制、存储方式等
            </li>
            <li>
              • 系统设置：配置时区、时间格式、语言等系统参数
            </li>
          </ul>
          <Text type="secondary" className="mt-4 block">
            注意：部分配置修改后需要重启系统才能生效
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ConfigPage;