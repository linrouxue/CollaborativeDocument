'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Form,
  Input,
  Button,
  Typography,
  message,
  Space,
  Card,
  Layout,
  Spin
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(255,255,255, 0.2) 100%);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const StyledCard = styled(Card)`
  max-width: 500px;
  margin: 0 auto;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.25);
  }
`;

const StyledTitle = styled(Title)`
  text-align: center;
  margin-bottom: 24px !important;
  background: linear-gradient(45deg, #1890ff, #73a3f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-input-affix-wrapper {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
  }
`;

const StyledButton = styled(Button)`
  height: 40px;
  font-size: 16px;
  background: linear-gradient(45deg, #1890ff, #cacaca);
  border: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0,0,0,0.2);
  }
`;

export default function Home() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (isLogin) {
        router.push('/Home');
      } else {
        message.success('註冊成功！請登錄');
        setIsLogin(true);
      }
    } catch (error) {
      message.error('操作失敗，請重試');
    }
  };

  const toggleForm = () => setIsLogin(!isLogin);

  if (!mounted) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgb(245, 246, 247)'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <StyledLayout>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <TwitterOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <Title level={1} style={{ marginBottom: '16px', color: '#1890ff' }}>
              协同文档平台
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              与团队一起创建、分享和协作文档，打造属于您的知识库
            </Text>
          </div>

          <StyledCard>
            <StyledTitle level={2}>
              {isLogin ? '登录' : '注册'}
            </StyledTitle>
            <StyledForm
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
            >
              {!isLogin && (
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                    placeholder="姓名"
                    size="large"
                  />
                </Form.Item>
              )}
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的的邮箱' }
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
                >
                  {isLogin ? '登錄' : '註冊'}
                </StyledButton>
              </Form.Item>
              <Button
                type="link"
                onClick={toggleForm}
                block
                style={{ color: '#1890ff' }}
              >
                {isLogin ? '沒有帳號？點擊註冊' : '已有帳號？點擊登錄'}
              </Button>
            </StyledForm>
          </StyledCard>
        </Space>
      </Content>
    </StyledLayout>
  );
}