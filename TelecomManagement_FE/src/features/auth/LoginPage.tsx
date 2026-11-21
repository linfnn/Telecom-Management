import { LockOutlined, UserOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Form,
  Input,
  Layout,
  Typography,
  theme,
  Row,
  Col,
  Avatar
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../../api/authApi";
import { useAuth } from "./useAuth";

const { Title, Text } = Typography;

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();
  const { token } = theme.useToken();
  
  const onFinish = async (values: LoginFormValues) => {
    setError("");
    setSubmitting(true);
    try {
      const data = await loginApi({
        email: values.email,
        password: values.password,
      });

      login(data.token, data.refreshToken, data.user);
      navigate("/reports", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.login_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100dvh" }}>
      <Row style={{ minHeight: "100dvh", width: "100%", margin: 0 }}>
        {/* Left Branding Panel (Hidden on small screens) */}
        <Col 
          xs={0} sm={0} md={12} lg={14} 
          style={{
            background: `linear-gradient(135deg, #0f172a 0%, #020617 100%)`, // Premium deep slate
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "80px 64px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Abstract Shapes */}
          <div style={{ position: "absolute", top: "-15%", right: "-15%", width: "60%", height: "60%", background: `radial-gradient(circle, ${token.colorPrimary}30 0%, transparent 60%)` }} />
          <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "50%", height: "50%", background: `radial-gradient(circle, ${token.colorPrimary}20 0%, transparent 70%)` }} />
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <Title level={3} style={{ color: "rgba(255, 255, 255, 0.95)", fontWeight: 800, letterSpacing: "-1px", margin: 0 }}>
              QuanLyVienThong
            </Title>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "16px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>
              Management System
            </Text>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <Title level={1} style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: "48px", lineHeight: 1.2, letterSpacing: "-1.5px" }}>
              Nền tảng quản lý<br/>viễn thông hiện đại.
            </Title>
            <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "18px", display: "block", marginTop: "24px", maxWidth: "480px", lineHeight: 1.6 }}>
              Hệ thống cung cấp giải pháp tối ưu cho việc vận hành, giám sát và quản lý cơ sở hạ tầng mạng lưới một cách chuyên nghiệp và trực quan nhất.
            </Text>
            
            <div style={{ marginTop: "56px", display: "flex", alignItems: "center", gap: "16px" }}>
              <Avatar.Group size="large" style={{ display: 'flex' }}>
                <Avatar style={{ backgroundColor: '#f56a00', border: '2px solid rgba(255,255,255,0.2)' }}>H</Avatar>
                <Avatar style={{ backgroundColor: '#87d068', border: '2px solid rgba(255,255,255,0.2)' }} icon={<UserOutlined />} />
                <Avatar style={{ backgroundColor: '#1677ff', border: '2px solid rgba(255,255,255,0.2)' }}>T</Avatar>
              </Avatar.Group>
              <div>
                <Text style={{ color: "#fff", fontWeight: 600, display: "block" }}>Tin dùng bởi</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>+10,000 Quản trị viên</Text>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Login Panel */}
        <Col 
          xs={24} sm={24} md={12} lg={10} 
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: token.colorBgContainer,
            padding: "32px",
            position: "relative"
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: `radial-gradient(circle at 100% 0%, ${token.colorPrimary}10 0%, transparent 50%)`,
              pointerEvents: 'none'
            }}
          />
          <div style={{ width: "100%", maxWidth: 400, zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }} className="animate-fade-in-up">
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: `${token.colorPrimary}15`, 
                color: token.colorPrimary, 
                marginBottom: 24 
              }}>
                <LockOutlined style={{ fontSize: "32px" }} />
              </div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
                {t("login.title")}
              </Title>
              <Text type="secondary" style={{ fontSize: "15px", display: 'block', marginTop: '12px' }}>
                {t("login.sumary")}
              </Text>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 24, borderRadius: 12 }}
                className="animate-fade-in-up"
              />
            )}

            <div style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <Form<LoginFormValues>
                  name="login_form"
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark={false}
                >
                  <Form.Item
                    name="email"
                    label={<span style={{ fontWeight: 600 }}>{t("login.email")}</span>}
                    rules={[
                      { required: true, message: t("login.error.email_required") },
                      { type: "email", message: t("login.error.email_invalid") },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: token.colorTextQuaternary, marginRight: 8 }} />}
                      placeholder={t("login.email")}
                      autoComplete="email"
                      size="large"
                      style={{ borderRadius: '12px', padding: '10px 16px' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label={<span style={{ fontWeight: 600 }}>{t("login.password")}</span>}
                    rules={[{ required: true, message: t("login.error.password_required") }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: token.colorTextQuaternary, marginRight: 8 }} />}
                      placeholder={t("login.password")}
                      autoComplete="current-password"
                      size="large"
                      style={{ borderRadius: '12px', padding: '10px 16px' }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 8, marginTop: 32 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={submitting}
                      style={{ fontWeight: 600, borderRadius: '12px', height: '48px' }}
                    >
                      {t("login.sumbit_btn")}
                    </Button>
                  </Form.Item>
                </Form>
              </div>

            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
