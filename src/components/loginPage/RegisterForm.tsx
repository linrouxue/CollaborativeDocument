import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { StyledForm, StyledButton } from '../../app/(public)/login/LoginRegister.styles';
import axios from 'axios';
import LoginForm from './LoginForm';

interface RegisterFormProps {
  mode: 'register' | 'forgot';
  onBackToLogin: () => void;
}

export default function RegisterForm({ mode, onBackToLogin }: RegisterFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const isForgotMode = mode === 'forgot';

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

  if (isRegistered && !isForgotMode) {
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
          placeholder={isForgotMode ? "请输入注册时的邮箱" : "电子邮箱"}
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
        rules={[
          { required: true, message: isForgotMode ? '请输入新密码' : '请输入密码' },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              
              if (value.length < 6 || !/^(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
                return Promise.reject(new Error('密码至少6位且必须包含字母和数字'));
              }
              
              return Promise.resolve();
            }
          }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#1890ff' }} />}
          placeholder={isForgotMode ? "新密码" : "密码"}
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
          { required: true, message: isForgotMode ? '请确认新密码' : '请确认密码' },
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
          {isForgotMode ? '重置密码' : '注册'}
        </StyledButton>
      </Form.Item>
    </StyledForm>
  );
} 