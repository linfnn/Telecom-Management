# TelecomManagement

Hệ thống quản lý hạ tầng viễn thông gồm React SPA và Django REST API. Backend
lưu dữ liệu nghiệp vụ trên MSSQL; model nghiệp vụ Django dùng `managed = False`,
FE giao tiếp qua HTTP API và Socket.IO giám sát, không thay đổi database/schema.

## Thành phần

- **Frontend — [TelecomManagement_FE](./TelecomManagement_FE/README.md):**
  React 19, TypeScript, Vite 8, Ant Design, React Router, Axios, Chart.js,
  i18next.
- **Backend — [TelecomManagement_BE](./TelecomManagement_BE/README.md):**
  Python 3.12+, Django 6.1, Django REST Framework, Python Socket.IO/Daphne,
  Simple JWT, MSSQL qua `mssql-django`/`pyodbc`, OpenAPI/Swagger.
- API base path: `/qlmvt`; Swagger: `http://127.0.0.1:8000/qlmvt/swagger/`.

## Chạy đồng thời trên macOS/Linux

### 1. Khởi tạo Backend

Yêu cầu Python 3.12+, SQL Server tương thích với database và ODBC Driver 18.
Trên macOS, SQL Server cần chạy trong Docker/VM hoặc host khác. Xem
[hướng dẫn MSSQL chi tiết](./TelecomManagement_BE/README.md#yêu-cầu).

Terminal 1:

```bash
cd TelecomManagement_BE
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
```

Điền thông tin kết nối MSSQL trong `TelecomManagement_BE/.env`. Nếu database
đã có dữ liệu, không chạy lại script tạo schema. Xem các lựa chọn restore/khởi
tạo an toàn trong [README Backend](./TelecomManagement_BE/README.md#khởi-tạo-hoặc-phục-hồi-database).
Sau khi database đã sẵn sàng:

```bash
python manage.py migrate
python manage.py check
python manage.py runserver 127.0.0.1:8000
```

`migrate` chỉ tạo bảng Django/auth, không tạo hoặc sửa các bảng nghiệp vụ.

### 2. Khởi chạy Frontend

Terminal 2:

```bash
cd TelecomManagement_FE
npm install
cp .env.example .env.local
npm run dev
```

Mặc định Vite chạy tại `http://localhost:5173`, proxy `/qlmvt` và `/socket.io`
tới `http://127.0.0.1:8000`. Nếu backend chạy ở host/cổng khác, sửa
`VITE_DEFAULT_API_BASE_URL` trong `.env.local` thành origin của backend. Đăng
nhập bằng tài khoản có trong database đang dùng; tài khoản demo chỉ có nếu
database được restore kèm tài khoản đó.

## Chatbot AI

Chatbot dùng `POST /qlmvt/api_chatbot_ask/` và Gemini OpenAI-compatible API.
Cấu hình `CHATBOT_API_KEY`, `CHATBOT_BASE_URL`,
`CHATBOT_MODEL=gemini-3.5-flash-lite` ở `TelecomManagement_BE/.env`, sau đó
khởi động lại backend. Có thể thêm trực tiếp các dòng cấu hình vào `.env` hiện
có; không đặt key trong FE hoặc commit key. Khi thiếu key, backend trả HTTP 503
và hướng dẫn cấu hình. Chatbot hiểu đầu vào Việt/Anh và luôn trả lời tiếng Việt;
chỉ tra cứu theo quyền, hướng dẫn thao tác ghi thay vì tự thực hiện. Backend
hiện phân quyền Chatbot theo Admin và tài khoản thường; tài khoản thường chỉ
xem hồ sơ của mình và sự cố/lỗ hổng được giao, còn thiết bị/liên kết/hiệu suất
theo quyền đọc hiện có của API. Admin có thể yêu cầu rõ ràng để tải backup JSON.
Câu hỏi, history và kết quả tra cứu
được chuyển tới provider; nội dung backup không được gửi tới provider.

## Kiểm tra

```bash
# Terminal FE
npm run lint
npm run build

# Terminal BE (virtualenv đã kích hoạt)
python manage.py test qlmvt.tests.test_chatbot
python manage.py test qlmvt.tests.test_network_monitor
python manage.py check
```

Dashboard nhận trạng thái ping qua Socket.IO `/socket.io`; backend
chỉ kiểm tra IP đã đăng ký. CPU/RAM/nhiệt độ và trạng thái liên kết vật lý cần
agent/SNMP hoặc controller riêng; hiện các thông tin này chưa có nguồn dữ liệu.

README riêng: [Backend](./TelecomManagement_BE/README.md) mô tả API, Swagger,
MSSQL và backup/restore; [Frontend](./TelecomManagement_FE/README.md) mô tả
giao diện và lệnh phát triển. Root không cần `.env` hoặc `requirements.txt`
chung: backend có `.env.example`/`requirements.txt`, frontend có
`.env.example`/`package.json`.
