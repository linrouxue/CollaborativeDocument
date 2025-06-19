'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Form,
  Button,
  Typography,
  message,
  Space,
  Layout,
  Spin
} from 'antd';
import {
  TwitterOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';
import LoginForm from '../../../components/loginPage/LoginForm';
import RegisterForm from '../../../components/loginPage/RegisterForm';
import { StyledLayout, StyledCard, StyledTitle } from './LoginRegister.styles';

const { Title, Text } = Typography;
const { Content } = Layout;

export default function Home() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
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
            {isLogin ? (
              <LoginForm />
            ) : (
              <RegisterForm />
            )}
            <Button
              type="link"
              onClick={toggleForm}
              block
              style={{ color: '#1890ff' }}
            >
              {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
            </Button>
          </StyledCard>
        </Space>
      </Content>
    </StyledLayout>
  );
}