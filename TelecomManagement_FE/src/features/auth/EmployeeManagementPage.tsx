import { DeleteOutlined, UserAddOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  type Employee,
} from "../../api/employeesApi";
import { useMetadata } from "../../contexts/useMetadata";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

type EmployeeFormValues = {
  HoTen: string;
  Email: string;
  SoDienThoai: string;
  ChuyenMon?: string;
  VaiTro: string;
};

export const EmployeeManagementPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<EmployeeFormValues>();
  const { refreshMetadata } = useMetadata();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Tải danh sách nhân viên từ API
  const loadEmployees = useCallback(async () => {
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách nhân viên.",
      );
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getEmployees()
      .then((data) => {
        if (active) setEmployees(Array.isArray(data) ? data : []);
      })
      .catch((error: unknown) => {
        if (!active) return;
        message.error(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách nhân viên.",
        );
        setEmployees([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // 2. Thêm nhân viên mới
  const handleAddEmp = async (values: EmployeeFormValues) => {
    const payload = {
      HoTen: values.HoTen.trim(),
      Email: values.Email.trim(),
      SoDienThoai: values.SoDienThoai.trim(),
      ChuyenMon: values.ChuyenMon ? values.ChuyenMon.trim() : "",
      VaiTro: values.VaiTro,
    };

    try {
      setSubmitting(true);
      const res = await createEmployee(payload);

      if (res.success) {
        message.success(res.message || "Đã thêm nhân viên thành công!");
        form.resetFields();
        loadEmployees();

        await refreshMetadata();
      } else {
        message.error(res.message || "Thêm nhân viên thất bại.");
      }
    } catch (error: unknown) {
      message.error(
        `LỖI: ${
          error instanceof Error ? error.message : "Không thể kết nối máy chủ."
        }`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Xóa nhân viên
  const handleDeleteEmp = async (id: number) => {
    try {
      const res = await deleteEmployee(id);
      if (res.success) {
        message.success(res.message || "Đã xóa nhân viên thành công.");
        loadEmployees();
        await refreshMetadata();
      } else {
        message.error(res.message || "Không thể xóa nhân viên.");
      }
    } catch (error: unknown) {
      message.error(
        `LỖI: ${error instanceof Error ? error.message : "Xóa thất bại."}`,
      );
    }
  };

  // Cấu hình các cột hiển thị trong Table Antd
  const columns: ColumnsType<Employee> = [
    {
      title: t('employee_management.table.name'),
      dataIndex: "HoTen",
      key: "HoTen",
      className: "fw-bold",
    },
    {
      title: t('employee_management.table.email'),
      dataIndex: "Email",
      key: "Email",
    },
    {
      title: t('employee_management.table.phone'),
      dataIndex: "SoDienThoai",
      key: "SoDienThoai",
      render: (v) => v || "—",
    },
    {
      title: t('employee_management.table.specialty'),
      dataIndex: "ChuyenMon",
      key: "ChuyenMon",
      render: (v) => (v && String(v).trim() !== "" ? String(v) : "—"),
    },
    {
      title: t('employee_management.table.role'),
      dataIndex: "VaiTro",
      key: "VaiTro",
      render: (v: string) => {
        // Tự động gán màu sắc Tag dựa trên vai trò
        const colorMap: Record<string, string> = {
          Admin: "red",
          Technician: "blue",
          Supervisor: "orange",
        };
        return <Tag color={colorMap[v] || "default"}>{v}</Tag>;
      },
    },
    {
      title: t('employee_management.table.actions'),
      align: "right",
      render: (_, record) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: t('employee_management.delete_confirm_title'),
              content: `${t('employee_management.delete_confirm_content')} ${record.HoTen}?`,
              okText: t('employee_management.delete_btn'),
              okType: "danger",
              cancelText: t('employee_management.cancel_btn'),
              centered: true,
              onOk: () => handleDeleteEmp(record.MaNV),
            });
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "4px" }}>
      <Title level={3} style={{ fontWeight: "bold", marginBottom: 24 }}>
        {t('employee_management.title')}
      </Title>

      {/* Form thêm mới nhân viên */}
      <Card
        title={
          <Space style={{ color: "#13c2c2" }}>
            <UserAddOutlined />
            <span style={{ fontWeight: "bold" }}>{t('employee_management.add_new')}</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
        className="shadow-sm border-0"
      >
        <Form<EmployeeFormValues>
          form={form}
          layout="vertical"
          onFinish={handleAddEmp}
        >
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={12} md={5}>
              <Form.Item
                name="HoTen"
                label={t('employee_management.name')}
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder={t('employee_management.name')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item
                name="Email"
                label={t('employee_management.email')}
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không đúng định dạng" },
                ]}
              >
                <Input placeholder={t('employee_management.email')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                name="SoDienThoai"
                label={t('employee_management.phone')}
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              >
                <Input placeholder={t('employee_management.phone')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="ChuyenMon" label={t('employee_management.specialty')}>
                <Input placeholder={t('employee_management.specialty')} maxLength={100} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={3}>
              <Form.Item
                name="VaiTro"
                label={t('employee_management.role')}
                rules={[{ required: true, message: "Chọn vai trò" }]}
              >
                <Select placeholder={t('employee_management.role')}>
                  <Select.Option value="Admin">{t('employee_management.roles.admin')}</Select.Option>
                  <Select.Option value="Technician">{t('employee_management.roles.tech')}</Select.Option>
                  <Select.Option value="Supervisor">{t('employee_management.roles.supervisor')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={2}>
              <Button
                type="primary"
                style={{
                  backgroundColor: "#13c2c2",
                  borderColor: "#13c2c2",
                  fontWeight: "bold",
                  marginBottom: 24
                }}
                htmlType="submit"
                block
                loading={submitting}
              >
                {t('employee_management.add_btn')}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Bảng danh sách nhân viên */}
      <Card
        className="shadow-sm border-0"
        styles={{ body: { padding: 0 } }}
        style={{ overflow: "hidden" }}
      >
        <Table
          rowKey="MaNV"
          loading={loading}
          columns={columns}
          dataSource={employees}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
