import React from "react";
import { Modal, Form, Input, Select, Button, Typography, Row, Col, Flex, Divider, theme } from "antd";
import type { FormInstance } from "antd";
import { CloudOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

type AddDeviceFormValues = {
  deviceType: string;
  name: string;
  ip: string;
  location: string;
  power: "ON" | "OFF";
};

interface AddDeviceModalProps {
  visible: boolean;
  form: FormInstance<AddDeviceFormValues>;
  onCancel: () => void;
  onSubmit: (values: AddDeviceFormValues) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ visible, form, onCancel, onSubmit }) => {
  const { token } = theme.useToken();
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      styles={{ body: { padding: 0 } }}
      closeIcon={null}
    >
      <Flex align="center" gap={16} style={{ padding: '24px 24px 0 24px' }}>
        <Flex justify="center" align="center" style={{ width: 64, height: 64, background: token.colorFillAlter, borderRadius: 12 }}>
          <CloudOutlined style={{ color: token.colorPrimary, fontSize: 24 }} />
        </Flex>
        <Flex vertical>
          <Text type="secondary" strong style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Thêm node vào topology</Text>
          <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>Thêm {form.getFieldValue('deviceType')}</Title>
        </Flex>
      </Flex>
      
      <div style={{ padding: '0 24px', marginTop: 24 }}>
        <Divider style={{ margin: '0 0 24px 0' }} />
        <Form<AddDeviceFormValues>
          form={form}
          layout="vertical"
          onFinish={onSubmit}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="deviceType" label={<Text strong>Loại thiết bị</Text>}>
                <Input disabled size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label={<Text strong>Tên thiết bị <Text type="danger">*</Text></Text>} rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ip" label={<Text strong>Địa chỉ IP <Text type="danger">*</Text></Text>} rules={[{ required: true, message: 'Vui lòng nhập IP' }]}>
                <Input size="large" placeholder="Ví dụ: 10.10.10.30" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label={<Text strong>Vị trí <Text type="danger">*</Text></Text>} rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}>
                <Input size="large" placeholder="Ví dụ: Server Zone" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="power" label={<Text strong>Trạng thái nguồn</Text>}>
                <Select size="large">
                  <Option value="ON">Hoạt động (ON)</Option>
                  <Option value="OFF">Dự phòng (OFF)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Flex align="center" gap={8} style={{ marginTop: 16 }}>
            <Flex justify="center" align="center" style={{ width: 16, height: 16, background: token.colorPrimary, color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 'bold' }}>i</Flex>
            <Text type="secondary">Thiết bị sẽ đồng thời xuất hiện trên trang Giám sát hạ tầng và Thiết bị & Node.</Text>
          </Flex>

          <Flex justify="flex-end" gap={12} style={{ marginTop: 32, marginBottom: 24 }}>
            <Button size="large" onClick={onCancel} style={{ width: 120, fontWeight: 600 }}>Hủy</Button>
            <Button size="large" type="primary" htmlType="submit" style={{ width: 160, fontWeight: 600 }}>+ Thêm thiết bị</Button>
          </Flex>
        </Form>
      </div>
    </Modal>
  );
};
