# Triển khai TelecomManagement trên Render

## Kiến trúc

- **Frontend:** Render Static Site, build từ `TelecomManagement_FE`.
- **Backend:** Render Web Service dùng Dockerfile trong `TelecomManagement_BE`
  để cài Microsoft ODBC Driver 18 và chạy Django ASGI/Daphne (HTTP + Socket.IO).
- **Database:** SQL Server hiện có ở bên ngoài Render. Render Free không cung cấp
  SQL Server; không dùng Render Postgres thay thế trực tiếp cho MSSQL.

Render hỗ trợ WebSocket, nhưng Free Web Service sẽ spin down sau 15 phút không
nhận traffic; lần khởi động lại có thể mất khoảng một phút. Filesystem của Free
Web Service là tạm thời. Không lưu database, uploads hay backup `.bak` trên
filesystem của service. Free phù hợp demo/thử nghiệm, không phải production có
yêu cầu uptime.

## 1. Backend Web Service

Trong Render Dashboard chọn **New → Web Service**, kết nối repository và chọn:

| Thiết lập | Giá trị |
|---|---|
| Runtime | Docker |
| Root Directory | `TelecomManagement_BE` |
| Dockerfile Path | `./Dockerfile` |
| Instance Type | Free để demo |
| Region | Chọn gần SQL Server; đặt FE/BE cùng region khi có thể |

Dockerfile cài ODBC Driver 18, cài `TelecomManagement_BE/requirements.txt`,
collect static files và chạy Daphne trên `0.0.0.0:$PORT` (Render cấp `PORT`).
Django 6.1 yêu cầu Python 3.12 trở lên; Dockerfile dùng Python 3.12.

Thêm các Environment Variables trong Render Dashboard (không đưa secrets vào
Git hoặc frontend):

```dotenv
DEBUG=False
SECRET_KEY=<random-django-secret>
DJANGO_ALLOWED_HOSTS=<backend-service>.onrender.com

DB_NAME=QuanLyMangVienThong
DB_USER=<application-sql-login>
DB_PASSWORD=<database-password>
DB_HOST=<sql-server-hostname>
DB_PORT=1433
DB_ENCRYPT=yes
DB_TRUST_SERVER_CERTIFICATE=yes

IMPORT_EXPORT_FORMAT=qlmvt-json-import-export
IMPORT_EXPORT_VERSION=1
BACKUP_FORMAT=qlmvt-json-backup
BACKUP_VERSION=1

CORS_ALLOWED_ORIGINS=https://<frontend-site>.onrender.com
SOCKETIO_ALLOWED_ORIGINS=https://<frontend-site>.onrender.com

CHATBOT_API_KEY=<provider-api-key>
CHATBOT_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
CHATBOT_MODEL=gemini-3.5-flash-lite
CHATBOT_TIMEOUT_SECONDS=30
```

`SECRET_KEY` nên tạo riêng cho production; không dùng secret mặc định/dev. Đổi
placeholder host thành các URL Render thực tế sau khi tạo service. Nếu dùng
custom domain, thêm origin HTTPS đó vào cả CORS và Socket.IO settings.

SQL Server phải chấp nhận kết nối TCP từ backend Render qua mạng công khai.
Không mở port 1433 cho toàn Internet nếu có thể tránh; giới hạn firewall theo
outbound IP ranges của Render phù hợp region, bật mã hóa TLS và dùng SQL login
quyền tối thiểu (không dùng `sa`). `DB_TRUST_SERVER_CERTIFICATE=yes` chỉ chấp
nhận khi SQL Server dùng chứng chỉ tự ký; với CA được tin cậy, đặt `no`.
Kiểm thử kết nối tới SQL trước khi chuyển dịch vụ production. Render không
đồng nghĩa với việc tự chuyển/restore database.

## 2. Frontend Static Site

Trong Render Dashboard chọn **New → Static Site**, kết nối cùng repository:

| Thiết lập | Giá trị |
|---|---|
| Root Directory | `TelecomManagement_FE` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

Thêm biến build-time:

```dotenv
VITE_DEFAULT_API_BASE_URL=https://<backend-service>.onrender.com
VITE_DEFAULT_API_TIMEOUT_MS=60000
```

Vite nhúng các biến `VITE_*` vào bundle khi build; sau khi đổi API URL cần
redeploy/rebuild Static Site. API key chatbot chỉ nằm trong Environment Variables
của backend, tuyệt đối không dùng biến `VITE_*`.

React Router dùng client-side routes. Nếu Render không tự trả `index.html` cho
deep links, thêm Rewrite Rule trong Static Site:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | Rewrite |

## 3. Khởi tạo database và migrations

Database hiện có cần được backup và chuyển/restore riêng trên SQL Server tương
thích trước khi trỏ backend tới đó. Kiểm tra schema, SQL objects, compatibility
level và dữ liệu bằng một bản restore thử nghiệm.

Không chạy `MSSQL/SQL_total_local.sql` trên database đã có dữ liệu: script này
có lệnh thay đổi database/schema. Các model nghiệp vụ dùng `managed=False`.
Chỉ chạy Django migrations khi đã xác nhận các bảng auth/session/token cần thiết
chưa có và đã có backup; không bật migration tự động mỗi lần deploy.

## 4. Kiểm tra sau deploy

- Mở Static Site, đăng nhập và kiểm tra một số API.
- Swagger: `https://<backend-service>.onrender.com/qlmvt/swagger/`.
- Kiểm tra backend Logs khi có lỗi DB, CORS hoặc provider AI.
- Mở Network Monitor và xác nhận Socket.IO kết nối; Free service có thể ngủ/
  ngắt kết nối khi idle.
- Thử Chatbot sau khi backend nạp đủ Gemini settings; không ghi API key vào log.
- Theo dõi Render usage, outbound bandwidth, build minutes, free instance hours,
  database availability và backup SQL độc lập.

Xem thêm: [README Backend](./TelecomManagement_BE/README.md) cho MSSQL/API và
[README Frontend](./TelecomManagement_FE/README.md) cho ứng dụng React.
