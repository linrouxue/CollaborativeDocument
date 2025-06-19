import { Form, Input, message } from 'antd';
import { MailOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StyledForm, StyledButton } from '../../app/(public)/login/LoginRegister.styles';
import axios from 'axios';

export default function LoginForm() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    // setLoading(true);
    router.push('/Home');
    // try {
    //   // 登录接口请求
    //   const res = await axios.post('/api/user/login', values);
    //   if (res.data && res.data.token) {
    //     message.success('登录成功！');
    //     // 可存储token等
    //     router.push('/Home');
    //   } else {
    //     message.error(res.data.message || '登录失败');
    //   }
    // } catch (error: any) {
    //   message.error(error?.response?.data?.message || '登录失败，请重试');
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <StyledForm
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
    >
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱' }
        ]}
      >
        <Input
          prefix={<MailOutlined style={{ color: '#1890ff' }} />}
          placeholder="电子邮箱"
          size="large"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#1890ff' }} />}
          placeholder="密码"
          size="large"
          iconRender={(visible) =>
            visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>
      <Form.Item>
        <StyledButton
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          登录
        </StyledButton>
      </Form.Item>
    </StyledForm>
  );
} 