import React, { useState, useRef, useEffect } from "react";
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined } from "@ant-design/icons";
import { Button, Input, Card, FloatButton, Space, Typography, Spin } from "antd";
import { askChatbot } from "../../api/chatbotApi";
import type { ChatMessage } from "../../api/chatbotApi";
import ReactMarkdown from "react-markdown";

const { Text } = Typography;

const STYLES = {
    container: { position: 'fixed', bottom: 0, right: 0, zIndex: 1000 } as React.CSSProperties,
    card: { position: 'fixed', bottom: 24, right: 24, width: 380, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)', borderRadius: 12, overflow: 'hidden', zIndex: 1000 } as React.CSSProperties,
    closeBtn: { color: 'white', cursor: 'pointer', fontSize: 16 } as React.CSSProperties,
    body: { flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f5f5f5' } as React.CSSProperties,
    footer: { padding: 12, backgroundColor: 'white', borderTop: '1px solid #f0f0f0' } as React.CSSProperties,
    typing: { display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
};

const getBubbleStyle = (role: string): React.CSSProperties => {
    const isUser = role === "user";
    return {
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: 12,
        fontSize: 14,
        lineHeight: 1.5,
        wordWrap: 'break-word',
        alignSelf: isUser ? "flex-end" : "flex-start",
        backgroundColor: isUser ? "#1677ff" : "white",
        color: isUser ? "white" : "#333",
        borderBottomRightRadius: isUser ? 4 : 12,
        borderBottomLeftRadius: isUser ? 12 : 4,
        boxShadow: !isUser ? "0 2px 5px rgba(0,0,0,0.05)" : "none"
    };
};

export const ChatbotWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "Xin chào! Tôi là trợ lý AI của hệ thống NMS. Tôi có thể giúp gì cho bạn?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isLoading]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: ChatMessage = { role: "user", content: inputValue };
        setMessages((previous) => [...previous, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const historyToSend = messages.map((message) => ({
                role: message.role,
                content: message.content,
            }));

            const response = await askChatbot(userMessage.content, historyToSend);
            if (response.type === "export") {
                if (!response.file_name || typeof response.file_content !== "string") {
                    throw new Error("Backend trả về file backup không hợp lệ.");
                }
                const blob = new Blob([response.file_content], {
                    type: "application/json;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = response.file_name;
                link.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 0);
            }
            setMessages((previous) => [
                ...previous,
                { role: "assistant", content: response.message },
            ]);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Lỗi kết nối đến máy chủ.";
            setMessages((previous) => [
                ...previous,
                { role: "assistant", content: `Xin lỗi, ${errorMessage}` },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={STYLES.container}>
            {isOpen && (
                <Card
                    title={
                        <Space>
                            <RobotOutlined style={{ fontSize: 20 }} />
                            <span>Trợ lý AI NMS</span>
                        </Space>
                    }
                    extra={<CloseOutlined style={STYLES.closeBtn} onClick={() => setIsOpen(false)} />}
                    style={STYLES.card}
                    styles={{
                        header: { backgroundColor: '#1677ff', color: 'white' },
                        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '400px' }
                    }}
                >
                    <div style={STYLES.body}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={getBubbleStyle(msg.role)}>
                                {msg.role === "assistant" ? (
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                ) : (
                                    <Text style={{ color: 'inherit' }}>{msg.content}</Text>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={STYLES.typing}>
                                <Spin size="small" /> <Text type="secondary" style={{ fontSize: 12 }}>Đang trả lời...</Text>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={STYLES.footer}>
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                placeholder="Nhập câu hỏi hoặc lệnh..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onPressEnter={handleSend}
                                disabled={isLoading}
                            />
                            <Button 
                                type="primary" 
                                icon={<SendOutlined />} 
                                onClick={handleSend}
                                loading={isLoading}
                            />
                        </Space.Compact>
                    </div>
                </Card>
            )}

            {!isOpen && (
                <FloatButton
                    icon={<MessageOutlined />}
                    type="primary"
                    style={{ right: 24, bottom: 24, width: 60, height: 60 }}
                    onClick={() => setIsOpen(true)}
                    tooltip="Hỏi AI"
                />
            )}
        </div>
    );
};


