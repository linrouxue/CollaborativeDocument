import { Form, Input, Button } from 'antd';
import { MailOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { StyledForm, StyledButton } from '../../app/(public)/login/LoginRegister.styles';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const [form] = Form.useForm();
  const { login, loading } = useAuth();

  const handleSubmit = async (values: any) => {
    const { email, password } = values;
    await login(email, password);
    // 其它逻辑不需要，AuthContext 已经处理跳转和弹窗
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱' },
        ]}
      >
        <Input
          prefix={<MailOutlined style={{ color: '#1890ff' }} />}
          placeholder="电子邮箱"
          size="large"
        />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password
          prefix={<LockOutlined style={{ color: '#1890ff' }} />}
          placeholder="密码"
          size="large"
          iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>
      <Form.Item>
        <StyledButton type="primary" htmlType="submit" block loading={loading}>
          登录
        </StyledButton>
      </Form.Item>
    </Form>
  );
}
