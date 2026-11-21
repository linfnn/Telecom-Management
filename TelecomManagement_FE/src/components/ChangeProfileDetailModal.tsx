import { IdcardOutlined } from "@ant-design/icons";
import { Avatar, Descriptions, Modal, Space, Typography, theme } from "antd";
import { useAuth } from "../features/auth";

const { Text, Title } = Typography;

export const ChangeProfileDetailModal = ({
  open,
  onCancel,
}: {
  open: boolean;
  onCancel: () => void;
}) => {
  const { user } = useAuth();
  const { token } = theme.useToken();

  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={600} centered>
      <Space size="middle" align="center" style={{ marginBottom: 24 }}>
        <Avatar
          size={64}
          icon={<IdcardOutlined />}
          style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary }}
        />
        <Space direction="vertical" size={0}>
          <Text type="secondary" strong>
            HỒ SƠ CÁ NHÂN
          </Text>
          <Title level={3} style={{ margin: 0 }}>
            Thông tin người dùng
          </Title>
        </Space>
      </Space>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Mã nhân viên">{user?.MaNV ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Họ và tên">{user?.HoTen ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Email">{user?.Email ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Quyền tài khoản">
          {user?.role === "admin" ? "Quản trị viên" : "Nhân viên"}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};
