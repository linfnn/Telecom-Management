# TelecomManagement Frontend

Ứng dụng SPA quản lý viễn thông, kết nối Django REST API tại `TelecomManagement_BE`.

## Công nghệ

- React 19, TypeScript, Vite 8
- Ant Design 6, React Router 7
- Axios, Chart.js, React i18next

## Chạy độc lập

Yêu cầu Node.js 22.12 trở lên và npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local` mặc định trỏ proxy phát triển tới backend tại
`http://127.0.0.1:8000`. API sử dụng prefix `/qlmvt`; Vite chuyển tiếp request
đến Django và proxy Socket.IO `/socket.io` cho giám sát mạng. Đổi
`VITE_DEFAULT_API_BASE_URL` nếu backend chạy ở host/cổng khác.

Mở `http://localhost:5173`. Kiểm tra mã nguồn bằng:

```bash
npm run lint
npm run build
```

## Tài liệu

- [Hướng dẫn chạy đồng thời Frontend và Backend](../README.md)
- [README Backend, API, Swagger và MSSQL](../TelecomManagement_BE/README.md)
- [Tích hợp API và giới hạn tính năng](./docs/api-integration.md)
- [Kiến trúc Frontend](./docs/architecture.md)

Backend cung cấp Socket.IO xác thực JWT cho trạng thái ping định kỳ; CPU/RAM/nhiệt độ,
trạng thái liên kết vật lý và điều khiển mạng cần nguồn SNMP/agent/controller
chưa được cấu hình. Audit log và 2FA cũng chưa có API. Chatbot gọi API đồng bộ
của backend; nhà cung cấp AI và API key được cấu hình riêng ở backend. Chatbot hiểu đầu vào
tiếng Việt/Anh nhưng chỉ trả lời tiếng Việt; chỉ tra cứu và (theo yêu cầu rõ
ràng của Admin) tải backup JSON, không ghi dữ liệu.
