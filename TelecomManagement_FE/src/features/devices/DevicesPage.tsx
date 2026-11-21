import { Badge, Button, Card, Col, Form, Input, message, Popconfirm, Row, Select, Space, Table, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createDevice, deleteDevice, getDevices, toggleDevicePower, type CreateDeviceRequest, type Device } from "../../api/devicesApi";
import type { ColumnsType } from "antd/es/table";
import { PlusCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

import { useTranslation } from "react-i18next";

export const DevicesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.VaiTro === "Admin";
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState("");

  const loadDevices = useCallback(async () => {
    try {
      const res = await getDevices();
      setDevices(res);
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Không tải được thiết bị.",
      );
    }
  }, []);

  const filteredDevices = useMemo(() => {
    if (!search) return devices;
    const keyword = search.toLowerCase();
    return devices.filter(
      (x) =>
        x.TenTB.toLowerCase().includes(keyword) ||
        x.DiaChiIP.toLowerCase().includes(keyword) ||
        x.LoaiTB.toLowerCase().includes(keyword) ||
        x.ViTri.toLowerCase().includes(keyword) ||
        x.TrangThai.toLowerCase().includes(keyword),
    );
  }, [search, devices]);

  useEffect(() => {
    let active = true;
    void getDevices()
      .then((data) => {
        if (active) setDevices(data);
      })
      .catch((error: unknown) => {
        if (active) {
          message.error(
            error instanceof Error ? error.message : "Không tải được thiết bị.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const columns: ColumnsType<Device> = [
    {
      title: t("device_management.table.name"),
      render: (_, record) => (
        <>
          <Typography.Text strong>{record.TenTB}</Typography.Text>
          <br />
          <Typography.Text type="secondary">{record.LoaiTB}</Typography.Text>
        </>
      ),
    },
    {
      title: "IP",
      dataIndex: "DiaChiIP",
      render: (v) => <Typography.Text code>{v}</Typography.Text>,
    },
    {
      title: t("device_management.table.location"),
      dataIndex: "ViTri",
    },
    {
      title: t("device_management.table.status"),
      render: (_, record) => (
        <Badge
          status={record.TrangThai === "Hoạt động" ? "success" : "default"}
          text={record.TrangThai}
        />
      ),
    },
    {
      title: t("device_management.table.power"),
      render: (_, record) => (
        isAdmin ? <Button
          size="small"
          color={record.TrangThai === "Hoạt động" ? "green" : "default"}
          variant="solid"
          onClick={() =>
            toggleDevicePower(record.MaTB, {
              TrangThai:
                record.TrangThai === "Hoạt động" ? "Dự phòng" : "Hoạt động",
            })
          }
        >
          {record.TrangThai === "Hoạt động" ? "ON" : "OFF"}
        </Button> : null
      ),
    },
    {
      title: t("device_management.table.vulns"),
      render: (_, record) => {
        const hasError = record.CoSuCo || record.TinhTrang === "Lỗi";

        return (
          <Button
            size="small"
            danger={hasError}
            type={hasError ? "primary" : "default"}
            onClick={() => navigate(`/errorlogs`)}
          >
            {hasError ? "Lỗi" : "Không lỗi"}
          </Button>
        );
      },
    },
    {
      title: t("device_management.table.actions"),
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/devices/${record.MaTB}`)}
          >
            Chi tiết
          </Button>
          {isAdmin && <Popconfirm
            title="Bạn có chắc chắn muốn xóa thiết bị này không?"
            onConfirm={async () => {
              try {
                await deleteDevice(record.MaTB);
                message.success("Xóa thiết bị thành công");
                loadDevices();
              } catch (error: unknown) {
                message.error(
                  error instanceof Error
                    ? error.message
                    : "Không thể xóa thiết bị",
                );
              }
            }}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger type="text">
              {t("device_management.delete")}
            </Button>
          </Popconfirm>}
        </Space>
      ),
    },
  ];

  const [form] = Form.useForm<CreateDeviceRequest>();

  const onAddDevice = async (values: CreateDeviceRequest) => {
    try {
      await createDevice(values);

      message.success("Thêm thiết bị thành công");

      form.resetFields();

      void loadDevices();
    } catch {
      message.error("Không thể thêm thiết bị");
    }
  };

  return (
    <>
      <Typography.Title level={3} style={{ marginBottom: 16, marginTop: 16 }}>
        {t("device_management.title")}
      </Typography.Title>
      <Card
        title={
          <>
            <PlusCircleOutlined /> {t("device_management.add_device.title")}
          </>
        }
        style={{ marginBottom: 16, display: isAdmin ? "block" : "none" }}
      >
        <Form<CreateDeviceRequest>
          form={form}
          layout="vertical"
          onFinish={onAddDevice}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={5}>
              <Form.Item
                name="TenTB"
                style={{ marginBottom: 0 }}
                rules={[{ required: true }]}
              >
                <Input placeholder={t("device_management.add_device.name")} />
              </Form.Item>
            </Col>

            <Col xs={24} md={4}>
              <Form.Item
                name="DiaChiIP"
                style={{ marginBottom: 0 }}
                rules={[{ required: true }]}
              >
                <Input placeholder="IP: 192.168.1.x" />
              </Form.Item>
            </Col>

            <Col xs={24} md={4}>
              <Form.Item
                name="LoaiTB"
                style={{ marginBottom: 0 }}
                initialValue="Router"
              >
                <Select
                  options={[
                    { value: "Internet", label: "Internet / Cloud" },
                    { value: "Router", label: "Router" },
                    { value: "Switch", label: "Switch" },
                    { value: "Firewall", label: "Firewall" },
                    { value: "Server", label: "Server" },
                    { value: "Access Point", label: "Access Point" },
                    { value: "PC", label: "PC / IoT" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={4}>
              <Form.Item name="ViTri" style={{ marginBottom: 0 }}>
                <Input
                  placeholder={t("device_management.add_device.location")}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={4}>
              <Form.Item
                name="TrangThai"
                style={{ marginBottom: 0 }}
                initialValue="Hoạt động"
              >
                <Select
                  options={[
                    {
                      value: "Hoạt động",
                      label: t(
                        "device_management.add_device.status_options.active",
                      ),
                    },
                    {
                      value: "Dự phòng",
                      label: t(
                        "device_management.add_device.status_options.inactive",
                      ),
                    },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={3}>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  htmlType="submit"
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  block
                >
                  {t("device_management.add_device.submit_btn")}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Search
            allowClear
            placeholder={t("device_management.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Typography.Text type="secondary">
            {filteredDevices.length === devices.length
              ? `${devices.length} ${t("device_management.devices")}`
              : ` ${t("device_management.show")} ${filteredDevices.length}/${devices.length} ${t("device_management.devices")}`}
          </Typography.Text>

          <Table
            rowKey="MaTB"
            columns={columns}
            dataSource={filteredDevices}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>
    </>
  );
};
