  const fetchApprovalInfo = async () => {
    try {
      const data = await request.get(`/crm-approval/contracts/${id}/approval`);
      setApprovalInfo(data);
    } catch (error) {
      // 如果没有审批流程，忽略错误
      setApprovalInfo(null);
    }
  };

  const handleStartApproval = async () => {
    try {
      await request.post(`/crm-approval/contracts/${id}/approval`, {
        contractName: contract?.name,
        amount: contract?.amount,
      });
      message.success('审批流程已启动');
      fetchApprovalInfo();
      fetchContractDetail(); // 刷新合同状态
    } catch (error: any) {
      message.error(error.message || '启动审批失败');
    }
  };

  const handleCancelApproval = async () => {
    try {
      await request.post(`/crm-approval/contracts/${id}/approval/cancel`);
      message.success('审批流程已取消');
      fetchApprovalInfo();
      fetchContractDetail(); // 刷新合同状态
    } catch (error: any) {
      message.error(error.message || '取消审批失败');
    }
  };

  const renderApprovalSteps = () => {
    if (!approvalInfo?.tasks) return null;

    const steps = approvalInfo.tasks.map((task: any, index: number) => ({
      title: task.name,
      description: (
        <div>
          <div>{task.assignee?.realName || '待分配'}</div>
          {task.completedAt && (
            <div style={{ fontSize: 12, color: '#666' }}>
              {dayjs(task.completedAt).format('YYYY-MM-DD HH:mm')}
            </div>
          )}
        </div>
      ),
      icon: getApprovalStepIcon(task),
    }));

    return (
      <Card title="审批流程" style={{ marginBottom: 16 }}>
        <Steps current={getCurrentApprovalStep()} items={steps} />
        {approvalInfo.status === 'REJECTED' && (
          <Alert
            message="审批被驳回"
            description={getRejectionReason()}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
        {approvalInfo.status === 'APPROVED' && (
          <Alert
            message="审批已通过"
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    );
  };

  const getApprovalStepIcon = (task: any) => {
    switch (task.status) {
      case 'COMPLETED':
        return task.result === 'APPROVED' ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#f5222d' }} />
        );
      case 'IN_PROGRESS':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getCurrentApprovalStep = () => {
    if (!approvalInfo?.tasks) return 0;
    
    const completedTasks = approvalInfo.tasks.filter(
      (task: any) => task.status === 'COMPLETED'
    ).length;
    
    return completedTasks;
  };

  const getRejectionReason = () => {
    if (!approvalInfo?.tasks) return '';
    
    const rejectedTask = approvalInfo.tasks.find(
      (task: any) => task.result === 'REJECTED'
    );
    
    return rejectedTask?.comment || '未提供原因';
  };

  const renderApprovalActions = () => {
    if (!contract) return null;

    if (contract.status === 'DRAFT' && !approvalInfo) {
      return (
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleStartApproval}
        >
          发起审批
        </Button>
      );
    }

    if (contract.status === 'PENDING' && approvalInfo?.status === 'PENDING') {
      return (
        <Popconfirm
          title="确定要取消审批流程吗？"
          onConfirm={handleCancelApproval}
          okText="确定"
          cancelText="取消"
        >
          <Button icon={<RollbackOutlined />}>
            取消审批
          </Button>
        </Popconfirm>
      );
    }

    return null;
  };