import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Tree,
  Avatar,
  Space,
  Tag,
  Typography,
  Button,
  message,
} from 'antd';
import {
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../../utils/request';
import './style.css';

const { Title, Text } = Typography;

interface Department {
  id: string;
  name: string;
  children?: Department[];
  users?: User[];
}

interface User {
  id: string;
  username: string;
  realName: string;
  avatar?: string;
  position?: string;
  phone?: string;
  email?: string;
  department?: { name: string };
}

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await request.get('/users/departments/tree');
      setDepartments(data);
    } catch (error) {
      console.error('获取部门失败:', error);
    }
  };

  const fetchUsers = async (params?: any) => {
    setLoading(true);
    try {
      const data = await request.get('/users', { params });
      setUsers(data.list);
    } catch (error) {
      console.error('获取用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    fetchUsers({ keyword: value });
  };

  const handleDeptSelect = (selectedKeys: React.Key[]) => {
    const deptId = selectedKeys[0] as string;
    setSelectedDept(deptId);
    if (deptId) {
      fetchUsers({ departmentId: deptId });
    } else {
      fetchUsers();
    }
  };

  const handleStartChat = (userId: string) => {
    navigate('/office/chat', { state: { targetUserId: userId } });
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      render: (text: string, record: User) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (dept: { name: string }) => dept?.name || '-',
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => position || '-',
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (record: User) => (
        <Space direction="vertical" size={0}>
          {record.phone && (
            <Text copyable={{ text: record.phone }}>
              <PhoneOutlined style={{ marginRight: 8 }} />
              {record.phone}
            </Text>
          )}
          {record.email && (
            <Text copyable={{ text: record.email }}>
              <MailOutlined style={{ marginRight: 8 }} />
              {record.email}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: User) => (
        <Space>
          <Button
            type="primary"
            icon={<MessageOutlined />}
            size="small"
            onClick={() => handleStartChat(record.id)}
          >
            发消息
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="contacts-page">
      <Title level={3}>通讯录</Title>
      
      <div className="contacts-container">
        <Card className="dept-card" title="组织架构">
          <Tree
            treeData={departments}
            fieldNames={{ title: 'name', key: 'id', children: 'children' }}
            onSelect={handleDeptSelect}
            selectedKeys={selectedDept ? [selectedDept] : []}
            defaultExpandAll
          />
        </Card>
        
        <Card
          className="users-card"
          title={
            <Space>
              <span>员工列表</span>
              {selectedDept && (
                <Tag closable onClose={() => { setSelectedDept(null); fetchUsers(); }}>
                  已筛选
                </Tag>
              )}
            </Space>
          }
          extra={
            <Input.Search
              placeholder="搜索姓名/用户名"
              allowClear
              onSearch={handleSearch}
              style={{ width: 250 }}
            />
          }
        >
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Contacts;
