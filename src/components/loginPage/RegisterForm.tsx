import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { StyledForm, StyledButton } from '../../app/(public)/login/LoginRegister.styles';
import axios from 'axios';
import LoginForm from './LoginForm';

export default function RegisterForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 注册接口请求
      const res = await axios.post('/api/user/register', values);
      if (res.data && res.data.user) {
        message.success('注册成功！请登录');
        setIsRegistered(true);
        form.resetFields();
      } else {
        message.error(res.data.message || '注册失败');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取验证码按钮点击事件（可后续实现）
  const handleGetCaptcha = async () => {
    setCaptchaLoading(true);
    setTimeout(() => setCaptchaLoading(false), 1000);
  };

  if (isRegistered) {
    // 注册成功后显示登录表单
    return <LoginForm />;
  }

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
        name="captcha"
        rules={[{ required: true, message: '请输入验证码' }]}
      >
        <div style={{ display: 'flex'}}>
          <Input
            prefix={<SafetyOutlined style={{ color: '#1890ff' }} />}
            style={{ flex: 7, color: '#1890ff' }}
            placeholder="验证码"
            size="large"
          />
          <StyledButton
            type="primary"
            style={{ flex: 3 }}
            loading={captchaLoading}
            onClick={handleGetCaptcha}
          >
            获取验证码
          </StyledButton>
        </div>
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
      <Form.Item
        name="confirmPassword"
        dependencies={["password"]}
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
        <Input.Password
          prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
          placeholder="确认密码"
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
          注册
        </StyledButton>
      </Form.Item>
    </StyledForm>
  );
} 