# Kiến trúc Frontend

React SPA tổ chức theo tính năng; `src/api/` là biên duy nhất gọi backend,
`src/contexts/` giữ auth và metadata, `src/routes/` bảo vệ màn hình, còn
`src/features/` chứa các trang nghiệp vụ.

```text
src/
├── api/          # Axios, JWT interceptor, DTO adapters và client theo domain
├── components/   # Chatbot, biểu đồ và UI dùng chung
├── contexts/     # Auth, theme, metadata
├── features/     # Auth, thiết bị/liên kết, sự cố, lỗ hổng, báo cáo
├── layouts/      # Header, sidebar và layout bảo vệ
└── routes/       # React Router, public/protected routes
```

Backend Django trả các field theo serializer/API (`snake_case` hoặc tên SQL ở
báo cáo). Adapter tại `src/api/backendFields.ts` chuẩn hóa payload và response
cho component hiện có. Quyền truy cập dữ liệu vẫn do JWT và permission của Django
thực thi; filter FE chỉ phục vụ hiển thị.

Dashboard dùng API Django và Socket.IO JWT để nhận snapshot mạng định kỳ; ping
chỉ kiểm tra các địa chỉ thiết bị đã lưu. CPU/RAM/nhiệt độ và điều khiển trạng
thái liên kết vật lý cần agent/SNMP/controller, chưa được giả lập. Bố cục
topology có thể lưu cục bộ. Chatbot dùng request/response đồng bộ và không giữ
API key nhà cung cấp ở trình duyệt.
