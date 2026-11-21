import React from "react";
import { Modal, Form, Input } from "antd";
import type { FormInstance } from "antd";

type ProfileConfigValues = {
  name: string;
  location: string;
};

interface ProfileConfigModalProps {
  visible: boolean;
  form: FormInstance<ProfileConfigValues>;
  onCancel: () => void;
  onSubmit: (values: ProfileConfigValues) => void;
}

export const ProfileConfigModal: React.FC<ProfileConfigModalProps> = ({ visible, form, onCancel, onSubmit }) => {
  return (
    <Modal title="Đổi tên / Vị trí" open={visible} onCancel={onCancel} onOk={() => form.submit()}>
      <Form<ProfileConfigValues>
        form={form}
        onFinish={onSubmit}
        layout="vertical"
      >
        <Form.Item name="name" label="Tên thiết bị" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="location" label="Vị trí">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};
