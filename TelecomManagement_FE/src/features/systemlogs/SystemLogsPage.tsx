import { Alert, Typography } from "antd";

export const SystemLogsPage = () => (
  <section>
    <Typography.Title level={3}>Nhật ký hệ thống</Typography.Title>
    <Alert
      type="info"
      showIcon
      message="Backend hiện chưa cung cấp API nhật ký kiểm toán."
      description="Trang này không tải dữ liệu giả. Hãy xem nhật ký dịch vụ trực tiếp trên môi trường vận hành."
    />
  </section>
);
