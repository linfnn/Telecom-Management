import {
  DeleteOutlined,
  DisconnectOutlined,
  LinkOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
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
  message,
  theme,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createLinkApi,
  deleteLinkApi,
  disconnectLinkApi,
  getLinksApi,
  type CreateLinkRequest,
  type Link,
} from "../../api/linksApi";
import { useMetadata } from "../../contexts/useMetadata";
import { useAuth } from "../auth";
import { useTranslation } from "react-i18next";

export const LinkDevicePage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<CreateLinkRequest>();
  const { user } = useAuth();
  const { token } = theme.useToken();

  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const { deviceOptions } = useMetadata();

  // Chuẩn hóa chuỗi tìm kiếm an toàn hơn
  const normalize = (s: unknown): string => {
    if (s === null || s === undefined) return "";
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  };

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return links;

    return links.filter((x) =>
      [x.TenTB_Goc, x.TenTB_Dich, x.BangThongToiDa, x.NguoiTao, x.MaLK].some(
        (f) => normalize(f).includes(q),
      ),
    );
  }, [links, search]);

  const loadLinks = useCallback(async () => {
    try {
      const data = await getLinksApi();
      setLinks(data);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : t('link_device.msg_load_error', 'Không tải được danh sách liên kết.'),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    void getLinksApi()
      .then((data) => {
        if (active) setLinks(data);
      })
      .catch((error: unknown) => {
        if (active) {
          message.error(
            error instanceof Error
              ? error.message
              : t(
                  "link_device.msg_load_error",
                  "Không tải được danh sách liên kết.",
                ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const addLink = async (values: CreateLinkRequest) => {
    const body = {
      ...values,
      BangThongToiDa: Number(values.BangThongToiDa),
    };

    try {
      setSubmitting(true);
      const res = await createLinkApi(body);
      message.success(res.message || t('link_device.msg_add_success', 'Thêm liên kết thành công.'));
      form.resetFields();
      loadLinks();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : t('link_device.msg_add_error', 'Không thể thêm liên kết.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLink = async (id: number) => {
    try {
      await deleteLinkApi(id);
      message.success(t('link_device.msg_delete_success', 'Đã xóa liên kết.'));
      loadLinks();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : t('link_device.msg_delete_error', 'Không thể xóa liên kết.'),
      );
    }
  };

  const disconnectLink = async (id: number) => {
    try {
      const res = await disconnectLinkApi(id);
      message.success(res.message || t('link_device.msg_disconnect_success', 'Đã ngắt liên kết.'));
      loadLinks();
    } catch {
      message.error(t('link_device.msg_disconnect_error', 'Không thể ngắt liên kết.'));
    }
  };

  const columns: TableColumnsType<Link> = [
    {
      title: t('link_device.table.source'),
      dataIndex: "TenTB_Goc",
    },
    {
      title: t('link_device.table.target'),
      dataIndex: "TenTB_Dich",
    },
    {
      title: t('link_device.table.bandwidth'),
      dataIndex: "BangThongToiDa",
      render: (v: number) => <Tag color="processing">{v} Mbps</Tag>,
    },
    {
      title: t('link_device.table.creator'),
      dataIndex: "NguoiTao",
      render: (v: string) => v || "--",
    },
    {
      title: t('link_device.table.actions'),
      align: "right",
      render: (_, record: Link) => (
        user?.VaiTro === "Admin" ? <Space>
          <Button
            icon={<DisconnectOutlined />}
            style={{
              color: token.colorWarning,
              borderColor: token.colorWarning,
            }}
            onClick={() => {
              Modal.confirm({
                title: t('link_device.confirm_disconnect_title', 'Xác nhận ngắt kết nối'),
                content: t('link_device.confirm_disconnect_content', 'Bạn có chắc chắn muốn ngắt liên kết này?'),
                okText: t('link_device.btn_disconnect', 'Ngắt'),
                cancelText: t('link_device.btn_cancel', 'Hủy'),
                centered: true,
                onOk: () => disconnectLink(record.MaLK),
              });
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: t('link_device.confirm_delete_title', 'Xác nhận xóa'),
                content: t('link_device.confirm_delete_content', 'Bạn có chắc chắn muốn xóa liên kết này?'),
                okText: t('link_device.btn_delete', 'Xóa'),
                okType: "danger",
                cancelText: t('link_device.btn_cancel', 'Hủy'),
                centered: true,
                onOk: () => deleteLink(record.MaLK),
              });
            }}
          />
        </Space> : null
      ),
    },
  ];

  return (
    <>
      <h2 style={{ marginBottom: 24 }}>{t('link_device.title')}</h2>

      <Card
        title={
          <Space>
            <LinkOutlined />
            <span>{t('link_device.add_new')}</span>
          </Space>
        }
        style={{ marginBottom: 16, display: user?.VaiTro === "Admin" ? "block" : "none" }}
      >
        <Form<CreateLinkRequest>
          form={form}
          layout="vertical"
          onFinish={addLink}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="MaTB_Goc"
                label={t('link_device.source')}
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: t('link_device.req_source', 'Vui lòng chọn thiết bị gốc') },
                ]}
              >
                <Select
                  showSearch
                  options={deviceOptions}
                  placeholder={t('link_device.ph_source', 'Chọn thiết bị gốc')}
                  filterOption={(input, option) =>
                    normalize(option?.label).includes(normalize(input))
                  }
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="MaTB_Dich"
                label={t('link_device.target')}
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: t('link_device.req_target', 'Vui lòng chọn thiết bị đích') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("MaTB_Goc") !== value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          t('link_device.err_target_same', 'Thiết bị đích không được trùng thiết bị gốc'),
                        ),
                      );
                    },
                  }),
                ]}
              >
                <Select
                  showSearch
                  options={deviceOptions}
                  placeholder={t('link_device.ph_target', 'Chọn thiết bị đích')}
                  filterOption={(input, option) =>
                    normalize(option?.label).includes(normalize(input))
                  }
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="BangThongToiDa"
                label={t('link_device.bandwidth')}
                style={{ marginBottom: 0 }}
                rules={[
                  {
                    required: true,
                    message: t('link_device.req_bandwidth', 'Vui lòng nhập băng thông tối đa'),
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder={t('link_device.ph_bandwidth', 'Nhập băng thông tối đa')}
                />
              </Form.Item>
            </Col>

            <Col
              span={6}
              style={{
                display: "flex",
                alignItems: "end",
              }}
            >
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
              >
                <PlusCircleOutlined />
                {t('link_device.add_btn')}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row justify="space-between" style={{ marginBottom: 16 }} align="middle">
        <Col span={8}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('link_device.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

        <Col>
          <Tag color="blue">
            {t('link_device.results')}: {filtered.length}/{links.length}
          </Tag>
        </Col>
      </Row>

      <Table
        rowKey="MaLK"
        columns={columns}
        dataSource={filtered}
        loading={loading} // Gắn loading vào Table để tăng UX
        pagination={{ pageSize: 10 }}
      />
    </>
  );
};
