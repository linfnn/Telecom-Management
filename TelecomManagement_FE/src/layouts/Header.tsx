import {
    GlobalOutlined,
    MoonOutlined,
    SunOutlined,
    UserOutlined,
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Dropdown,
    Layout,
    message,
    Space,
    Typography,
    theme,
    type MenuProps,
} from "antd";
import { useTheme } from "../contexts/useTheme";
import { useAuth } from "../features/auth";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { logoutApi } from "../api/authApi";
import { ChangeProfileDetailModal } from "../components/ChangeProfileDetailModal";
import { ChangePasswordModal } from "../components/ChangePasswordModal";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export const Header = () => {
    const { user, logout } = useAuth();
    const { dark, toggleTheme } = useTheme();
    const { token } = theme.useToken();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const name = user?.HoTen || "";

    const items = [
        {
            key: "profile",
            label: "Thông tin cá nhân",
        },
        {
            key: "change-password",
            label: "Đổi mật khẩu",
        },
        {
            key: "logout",
            label: "Đăng xuất",
            danger: true,
        },
    ];

    const { i18n } = useTranslation();

    const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
        i18n.changeLanguage(key); // Hàm đổi ngôn ngữ toàn hệ thống của i18next
    };

    const itemTrans: MenuProps["items"] = [
        { key: "vi", label: "Tiếng Việt (VI)" },
        { key: "en", label: "English (EN)" },
    ];

    const handleUserMenuClick = async ({ key }: { key: string }) => {
        if (key === "logout") {
            try {
                await logoutApi();
            } catch (error) {
                message.warning(
                    error instanceof Error
                        ? `Đăng xuất cục bộ; máy chủ chưa xác nhận: ${error.message}`
                        : "Đăng xuất cục bộ; máy chủ chưa xác nhận.",
                );
            }
            logout();
        }
        if (key === "profile") setIsProfileModalOpen(true);
        if (key === "change-password") setIsPasswordModalOpen(true);
    };

    return (
        <AntHeader
            style={{
                position: "fixed",
                top: 16,
                right: 24,
                width: "fit-content",
                height: 56,
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                borderRadius: 12,
                zIndex: 1000,
                background: token.colorBgContainer,
            }}
        >
            <Space size={16}>
                <Button
                    icon={dark ? <SunOutlined /> : <MoonOutlined />}
                    onClick={toggleTheme}
                />

                <Dropdown
                    menu={{ items: itemTrans, onClick: handleMenuClick }}
                    placement="bottomRight"
                >
                    <Button
                        icon={<GlobalOutlined />}
                        style={{ fontWeight: "bold" }}
                    >
                        {i18n.language.startsWith("en") ? "EN" : "VI"}
                    </Button>
                </Dropdown>

                <Dropdown
                    menu={{
                        items,
                        onClick: handleUserMenuClick,
                    }}
                    trigger={["click"]}
                >
                    <Space style={{ cursor: "pointer" }}>
                        <Avatar icon={<UserOutlined />} />
                        <Text strong>{name}</Text>
                    </Space>
                </Dropdown>
            </Space>
            <ChangeProfileDetailModal
                open={isProfileModalOpen}
                onCancel={() => setIsProfileModalOpen(false)}
            />
            <ChangePasswordModal
                open={isPasswordModalOpen}
                onCancel={() => setIsPasswordModalOpen(false)}
            />
        </AntHeader>
    );
};
