import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Typography, Upload, message, Modal } from "antd";
import type { UploadProps } from "antd";
import { useState } from "react";
import { backupDatabase, restoreDatabaseByFile } from "../../api/backupApi";

const { Title, Paragraph, Text } = Typography;

export const DatabaseMaintenancePage = () => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const downloadBackup = async () => {
    setBackupLoading(true);
    try {
      const backup = await backupDatabase();
      const url = URL.createObjectURL(backup);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qlmvt_backup.json";
      link.click();
      URL.revokeObjectURL(url);
      message.success("Đã tải bản sao lưu JSON.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể tải bản sao lưu.");
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreBackup: UploadProps["beforeUpload"] = (file) => {
    if (!file.name.toLowerCase().endsWith(".json")) {
      message.error("Chỉ chấp nhận file backup .json.");
      return Upload.LIST_IGNORE;
    }

    Modal.confirm({
      title: "Khôi phục dữ liệu từ JSON?",
      content:
        "Bản ghi có khóa chính đã tồn tại sẽ được giữ nguyên; chỉ bản ghi mới được thêm. Thao tác không xóa dữ liệu hiện có.",
      okText: "Khôi phục",
      cancelText: "Hủy",
      onOk: async () => {
        setRestoreLoading(true);
        try {
          const result = await restoreDatabaseByFile(file);
          const added = Object.values(result.data ?? {}).reduce(
            (total, model) => total + model.added,
            0,
          );
          const skipped = Object.values(result.data ?? {}).reduce(
            (total, model) => total + model.skipped,
            0,
          );
          message.success(
            `${result.message || "Khôi phục thành công."} Đã thêm ${added}, bỏ qua ${skipped} bản ghi.`,
          );
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : "Không thể khôi phục dữ liệu.",
          );
        } finally {
          setRestoreLoading(false);
        }
      },
    });
    return Upload.LIST_IGNORE;
  };

  return (
    <div>
      <Title level={3}>Sao lưu và khôi phục dữ liệu</Title>
      <Alert
        type="info"
        showIcon
        message="Chỉ làm việc với snapshot JSON của các bảng nghiệp vụ."
        description="API không thực hiện backup/restore file .bak hoặc thay đổi cấu trúc MSSQL. Khi khôi phục, bản ghi trùng khóa chính được bỏ qua; không có dữ liệu hiện có nào bị xóa hay ghi đè."
        style={{ marginBottom: 16 }}
      />
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={4}>Tải bản sao lưu</Title>
            <Paragraph>
              Tải snapshot JSON gồm dữ liệu nhân viên, thiết bị, liên kết, hiệu suất,
              lỗ hổng và nhật ký lỗi.
            </Paragraph>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={backupLoading}
              onClick={downloadBackup}
            >
              Tải qlmvt_backup.json
            </Button>
          </div>
          <div>
            <Title level={4}>Khôi phục từ snapshot</Title>
            <Paragraph>
              Chọn file backup JSON được tạo bởi cùng phiên bản API.
            </Paragraph>
            <Upload
              accept=".json,application/json"
              maxCount={1}
              showUploadList={false}
              beforeUpload={restoreBackup}
              disabled={restoreLoading}
            >
              <Button icon={<UploadOutlined />} loading={restoreLoading}>
                Chọn file JSON
              </Button>
            </Upload>
          </div>
          <Text type="secondary">
            Bản sao lưu không bao gồm tài khoản Django và không thay thế backup
            vật lý `.bak` của SQL Server.
          </Text>
        </Space>
      </Card>
    </div>
  );
};
