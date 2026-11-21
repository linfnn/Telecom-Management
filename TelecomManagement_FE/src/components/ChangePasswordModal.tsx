import { LockOutlined } from "@ant-design/icons";
import { Form, Input, message, Modal } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { changePasswordApi } from "../api/authApi";
import { useAuth } from "../features/auth";

interface ChangePasswordModalProps {
    open: boolean;
    onCancel: () => void;
}

export const ChangePasswordModal = ({
    open,
    onCancel,
}: ChangePasswordModalProps) => {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            await changePasswordApi({
                old_password: values.old_password,
                new_password: values.new_password,
            });

            message.success(t("password.change_success", "Đổi mật khẩu thành công!"));
            form.resetFields();
            onCancel();
            logout();
            navigate("/login", { replace: true });
        } catch (error: unknown) {
            message.error(
                error instanceof Error
                    ? error.message
                    : t("password.change_error", "Có lỗi xảy ra khi đổi mật khẩu"),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={t("password.change_title", "Đổi mật khẩu")}
            open={open}
            onOk={handleOk}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            confirmLoading={loading}
            okText={t("common.save", "Lưu thay đổi")}
            cancelText={t("common.cancel", "Huỷ")}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="old_password"
                    label={t("password.old_password", "Mật khẩu cũ")}
                    rules={[
                        { required: true, message: t("password.old_password_required", "Vui lòng nhập mật khẩu cũ") },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                    name="new_password"
                    label={t("password.new_password", "Mật khẩu mới")}
                    rules={[
                        { required: true, message: t("password.new_password_required", "Vui lòng nhập mật khẩu mới") },
                        { min: 6, message: t("password.new_password_min", "Mật khẩu phải từ 6 ký tự trở lên") },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                    name="confirm_password"
                    label={t("password.confirm_password", "Nhập lại mật khẩu mới")}
                    dependencies={["new_password"]}
                    rules={[
                        { required: true, message: t("password.confirm_password_required", "Vui lòng nhập lại mật khẩu mới") },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("new_password") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error(t("password.password_mismatch", "Mật khẩu nhập lại không khớp")));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
            </Form>
        </Modal>
    );
};
