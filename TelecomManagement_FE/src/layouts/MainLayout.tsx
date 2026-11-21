import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ChatbotWidget } from "../components/ChatbotWidget/ChatbotWidget";

const { Content } = Layout;

const MainLayout = () => {
    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sidebar />

            <Layout >
                <Header />

                <Content
                    style={{
                        margin: 24,
                        padding: 0,
                        paddingTop: 64,
                        borderRadius: 8,
                        overflow: "auto",
                        scrollbarWidth: "thin",
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
            
            <ChatbotWidget />
        </Layout>
    );
};

export default MainLayout;
