import {
  CheckOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  PlusCircleOutlined,
  RotateLeftOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createErrorLog,
  deleteErrorLog,
  exportErrorLogsJson,
  getErrorLogs,
  importErrorLogsJson,
  updateErrorAssignee,
  updateErrorHandled,
  type CreateErrorLogRequest,
  type ErrorLog,
} from "../../api/errorLogsApi";
import { useAuth } from "../auth"; // Giả định hook lấy user hiện tại
import type { UserContext } from "../../api";
import { useMetadata } from "../../contexts/useMetadata";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

const getSlaHoursBySeverity = (severity: number): number => {
  const map: Record<number, number> = { 1: 48, 2: 24, 3: 12, 4: 6, 5: 6 };
  return map[severity] || 48;
};

// Hàm tính số giờ SLA dựa vào mức độ nghiêm trọng (Sửa lại theo hệ thống BE: 1 => 48, 2 => 24, 3 => 12, 4 => 6, 5 => 6)
const SlaCountdownTag = ({ record }: { record: ErrorLog }) => {
  const { t } = useTranslation();
  const isHandled = record.DaXuLy === 1;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isHandled) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isHandled]);

  if (isHandled) return <Tag color="default">{t('error_logs.status_handled')}</Tag>;
  const deadline = dayjs(record.ThoiGianLoi).add(
    getSlaHoursBySeverity(Number(record.MucDoNghiemTrong)),
    "hour",
  );
  const remainingMs = deadline.diff(now);
  if (remainingMs <= 0) return <Tag color="error">Quá hạn SLA</Tag>;

  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return (
    <Tag color="success">
      {hours}h {minutes}m {seconds}s
    </Tag>
  );
};

// --- COMPONENT CHÍNH ---
export const ErrorLogPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<CreateErrorLogRequest>();
  const { user } = useAuth();

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const { deviceOptions, employeeOptions } = useMetadata();

  const isAdmin = user?.VaiTro === "Admin";

  const normalize = (s: unknown): string => {
    if (s === null || s === undefined) return "";
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  };

  // 1. Tải Nhật Ký Lỗi từ API
  const loadErrorLog = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getErrorLogs({
        requesterRole: user.VaiTro,
        requesterId: user.MaNV,
      });

      setErrorLogs(Array.isArray(res) ? res : []);
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Không tải được nhật ký lỗi.",
      );
      setErrorLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getErrorLogs({
      requesterRole: user.VaiTro,
      requesterId: user.MaNV,
    })
      .then((data) => {
        if (active) setErrorLogs(Array.isArray(data) ? data : []);
      })
      .catch((error: unknown) => {
        if (!active) return;
        message.error(
          error instanceof Error ? error.message : "Không tải được nhật ký lỗi.",
        );
        setErrorLogs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // 2. Logic tìm kiếm bằng useMemo
  const filteredLogs = useMemo(() => {
    const q = normalize(search);
    if (!q) return errorLogs;

    return errorLogs.filter((x) => {
      const isHandled = x.DaXuLy === 1;
      const statusTxt = isHandled ? t('error_logs.status_handled').toLowerCase() : t('error_logs.status_unhandled').toLowerCase();
      const timeStr = x.ThoiGianLoi
        ? dayjs(x.ThoiGianLoi).format("DD/MM/YYYY HH:mm:ss")
        : "";

      return [
        x.TenTB,
        x.MoTaLoi,
        x.MucDoNghiemTrong,
        x.HoTen,
        x.MaLoi,
        x.MaTB,
        x.MaNV_XuLy,
        timeStr,
        statusTxt,
      ].some((field) => normalize(field).includes(q));
    });
  }, [errorLogs, search, t]);

  // 3. Thêm mới sự cố & bắt lỗi Trigger SQL (Chặn xử lý quá 3 việc)
  const handleAddError = async (values: CreateErrorLogRequest) => {
    const body = {
      MaTB: values.MaTB,
      MoTaLoi: values.MoTaLoi,
      MucDoNghiemTrong: Number(values.MucDoNghiemTrong),
      MaNV_XuLy: values.MaNV_XuLy || null,
      DaXuLy: Number(values.DaXuLy) || 0,
    };

    try {
      const res = await createErrorLog(body);

      const msg = String(res.message || "");
      if (
        msg.includes("transaction") ||
        msg.includes("tối đa 3 sự cố") ||
        msg.includes("toi da 3 su co")
      ) {
        Modal.error({
          title: "Không thể phân công",
          content:
            "1 nhân viên đã xử lý tối đa 3 sự cố, yêu cầu chọn nhân viên khác.",
        });
        return;
      }

      message.success(res.message || "Đã ghi nhận lỗi thành công!");
      form.resetFields(["MoTaLoi", "MucDoNghiemTrong"]);
      loadErrorLog();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Lỗi hệ thống khi thêm sự cố.",
      );
    }
  };

  // 4. Phân công người xử lý sự cố (Admin)
  const handleAssignOwner = async (maLoi: number, maNV: number | null) => {
    try {
      await updateErrorAssignee(maLoi, { MaNV_XuLy: maNV });

      message.success("Phân công nhân viên thành công.");
      loadErrorLog();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Lỗi đường truyền phân công.",
      );
    }
  };

  // 5. Đánh dấu Trạng thái xử lý (Đã xử lý / Chưa xử lý)
  const handleSetHandled = async (maLoi: number, nextValue: number) => {
    try {
      const res = await updateErrorHandled(maLoi, { DaXuLy: nextValue });
      if (res.warning) message.warning(res.warning);
      message.success("Cập nhật trạng thái sự cố thành công.");
      loadErrorLog();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Lỗi xử lý trạng thái.",
      );
    }
  };

  // 6. Xóa sự cố (Chỉ xóa được khi đã giải quyết)
  const handleDeleteError = async (maLoi: number) => {
    try {
      const res = await deleteErrorLog(maLoi);

      message.success(res.message || "Đã xóa sự cố khỏi nhật ký thành công.");
      loadErrorLog();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Lỗi khi gửi yêu cầu xóa.",
      );
    }
  };

  // 7. Xuất dữ liệu theo định dạng JSON của API.
  const handleExportJson = async () => {
    try {
      const context: UserContext = {
        requesterRole: user?.VaiTro || "",
        requesterId: Number(user?.MaNV || 0),
      };
      const blob = await exportErrorLogsJson(context);

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `NhatKyLoi_Export_${dayjs().format("YYYYMMDD")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Không xuất được file JSON.",
      );
    }
  };

  const handleImportJson = async (file: File) => {
    try {
      await importErrorLogsJson(file, {
        requesterRole: user?.VaiTro || "",
        requesterId: Number(user?.MaNV || 0),
      });
      message.success("Nhập dữ liệu JSON thành công.");
      loadErrorLog();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Không thể nhập file JSON.",
      );
    }
    return false;
  };

  // Cấu hình các cột của bảng Antd Table
  const columns: ColumnsType<ErrorLog> = [
    {
      title: t('error_logs.table.time'),
      dataIndex: "ThoiGianLoi",
      key: "ThoiGianLoi",
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm:ss"),
    },
    { title: t('error_logs.table.device'), dataIndex: "TenTB", key: "TenTB" },
    { title: t('error_logs.table.desc'), dataIndex: "MoTaLoi", key: "MoTaLoi" },
    {
      title: t('error_logs.table.severity'),
      dataIndex: "MucDoNghiemTrong",
      key: "MucDoNghiemTrong",
      render: (v: number) => (
        <Tag color={v >= 4 ? "red" : v >= 2 ? "orange" : "blue"}>{v}</Tag>
      ),
    },
    {
      title: t('error_logs.table.sla'),
      key: "SlaCountdown",
      render: (_, record) => <SlaCountdownTag record={record} />,
    },
    {
      title: t('error_logs.table.assignee'),
      key: "MaNV_XuLy",
      width: 230,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Select
            size="small"
            disabled={!isAdmin}
            style={{ width: "100%" }}
            value={record.MaNV_XuLy || undefined}
            placeholder="-- Chọn --"
            onChange={(val) => handleAssignOwner(record.MaLoi, val || null)}
            options={employeeOptions}
            allowClear
          />
          <small style={{ color: "#999" }}>
            {record.HoTenXuLy || "Chưa phân công"}
          </small>
        </Space>
      ),
    },
    {
      title: t('error_logs.table.status'),
      dataIndex: "DaXuLy",
      key: "DaXuLy",
      render: (v) => (
        <Tag color={v ? "success" : "warning"}>
          {v ? t('error_logs.status_handled') : t('error_logs.status_unhandled')}
        </Tag>
      ),
    },
    {
      title: t('error_logs.table.actions'),
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="dashed"
            icon={<CheckOutlined />}
            onClick={() => handleSetHandled(record.MaLoi, 1)}
            title="Đã xử lý"
          />
          {isAdmin && <Button
            size="small"
            type="dashed"
            icon={<RotateLeftOutlined />}
            onClick={() => handleSetHandled(record.MaLoi, 0)}
            title="Chưa xử lý"
          />}
          {isAdmin && <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: "Xác nhận xóa",
                content: "Bạn có chắc chắn muốn xóa dòng sự cố này?",
                okText: "Xóa",
                okType: "danger",
                cancelText: "Hủy",
                centered: true,
                onOk: () => handleDeleteError(record.MaLoi),
              });
            }}
          />
          }
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "4px" }}>
      <Title level={3} style={{ fontWeight: "bold", marginBottom: 24 }}>
        {t('error_logs.title')}
      </Title>

      {/* Form ghi nhận sự cố mới (chỉ Admin được tạo theo API). */}
      <Card
        title={
          <Space style={{ color: "#d4b106" }}>
            <PlusCircleOutlined />
            <span style={{ fontWeight: "bold" }}>{t('error_logs.add_new')}</span>
          </Space>
        }
        style={{ marginBottom: 24, display: isAdmin ? "block" : "none" }}
        className="shadow-sm border-0"
      >
        <Form<CreateErrorLogRequest>
          form={form}
          layout="vertical"
          onFinish={handleAddError}
          initialValues={{ DaXuLy: "0" }}
        >
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={12} md={5}>
              <Form.Item
                name="MaTB"
                label={t('error_logs.device')}
                rules={[{ required: true, message: "Chọn thiết bị" }]}
              >
                <Select
                  placeholder={t('error_logs.device')}
                  options={deviceOptions}
                  showSearch
                  filterOption={(input, opt) =>
                    normalize(opt?.label).includes(normalize(input))
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="MoTaLoi"
                label={t('error_logs.desc')}
                rules={[{ required: true, message: "Nhập mô tả lỗi" }]}
              >
                <Input placeholder={t('error_logs.desc')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item name="MaNV_XuLy" label={t('error_logs.assignee')}>
                <Select
                  placeholder={t('error_logs.assignee')}
                  options={employeeOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item name="DaXuLy" label={t('error_logs.status')}>
                <Select>
                  <Select.Option value="0">{t('error_logs.status_unhandled')}</Select.Option>
                  <Select.Option value="1">{t('error_logs.status_handled')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={3}>
              <Form.Item
                name="MucDoNghiemTrong"
                label={t('error_logs.severity')}
                rules={[{ required: true, message: "Nhập mức độ (1-5)" }]}
              >
                <InputNumber
                  min={1}
                  max={5}
                  style={{ width: "100%" }}
                  placeholder="1 - 5"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={2}>
              <Button
                type="primary"
                style={{
                  backgroundColor: "#d4b106",
                  borderColor: "#d4b106",
                  fontWeight: "bold",
                  marginBottom: 24
                }}
                htmlType="submit"
                block
              >
                {t('error_logs.save')}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Tìm kiếm và JSON export/import */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 16 }}
        gutter={[8, 8]}
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('error_logs.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: "right" }}>
          <Space wrap>
            <Tag color="blue">
              {search
                ? `${t('error_logs.show')} ${filteredLogs.length} / ${errorLogs.length} ${t('error_logs.total')}`
                : `${errorLogs.length} ${t('error_logs.total')}`}
            </Tag>
            {isAdmin && <Button
              size="small"
              icon={<FileExcelOutlined />}
              onClick={handleExportJson}
            >
              Xuất JSON
            </Button>}
            {isAdmin && <Upload
              beforeUpload={handleImportJson}
              showUploadList={false}
              accept=".json,application/json"
            >
              <Button size="small" icon={<UploadOutlined />}>
                Nhập JSON
              </Button>
            </Upload>}
          </Space>
        </Col>
      </Row>

      {/* Bảng Sự Cố */}
      <Card
        className="shadow-sm border-0"
        style={{ overflow: "hidden" }}
      >
        <Table
          rowKey="MaLoi"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={filteredLogs}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: isAdmin
              ? t('error_logs.empty')
              : t('error_logs.empty_assigned'),
          }}
        />
      </Card>
    </div>
  );
};
