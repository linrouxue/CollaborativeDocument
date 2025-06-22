import styled from 'styled-components';
import { Layout, Card, Typography, Form, Button } from 'antd';

const { Title } = Typography;

export const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

export const StyledCard = styled(Card)`
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

export const StyledTitle = styled(Title)`
  text-align: center;
  margin-bottom: 24px !important;
  background: linear-gradient(45deg, #1890ff, #73a3f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-input-affix-wrapper {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
  }
`;

export const StyledButton = styled(Button)`
  height: 40px;
  font-size: 16px;
  background: linear-gradient(45deg, #1890ff, #cacaca);
  border: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  }
`;
