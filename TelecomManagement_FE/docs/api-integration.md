# Tích hợp API

## Cấu hình và xác thực

- Các request gửi tới `/qlmvt/...`; Vite dev proxy chuyển tiếp prefix này đến
  `VITE_DEFAULT_API_BASE_URL` (chỉ là origin, ví dụ `http://127.0.0.1:8000`).
- Đăng nhập `POST /qlmvt/api_login/`; access/refresh JWT được lưu ở client.
- Interceptor gắn `Authorization: Bearer <access>` và làm mới token qua
  `POST /qlmvt/api_refresh_token/` với `{ "refresh": "..." }`. Backend bật
  rotation nên client lưu cả refresh token mới nếu được trả về.
- Đăng xuất gửi refresh token tới `POST /qlmvt/api_logout/`. `/api_me/` trả
  trực tiếp `{ ma_nv, ho_ten, email, role }`.
- Request/response của API dùng tên `snake_case`; `src/api/backendFields.ts`
  chuyển các field nghiệp vụ sang tên UI đang dùng. Quyền được quyết định
  backend từ JWT, không từ requester role gửi bởi trình duyệt.
- Dashboard kết nối Socket.IO tại `/socket.io`, gửi access JWT qua `auth.token`,
  phát event `subscribe_network_monitor` và nhận `network_snapshot` ngay/cập nhật
  mỗi 30 giây. Vite proxy `/socket.io` tới backend trong môi trường phát triển.

## Các nhóm endpoint được sử dụng

| Tính năng | Backend API |
|---|---|
| Nhân viên | `api_get_ds_nv`, `api_create_nv`, `api_update_nv/{id}`, `api_delete_nv/{id}` |
| Thiết bị | `api_get_ds_tb`, `api_get_tb/{id}`, `api_create_tb`, `api_update_tb/{id}`, `api_delete_tb/{id}` |
| Hiệu suất | `api_get_ds_cshs` |
| Liên kết | `api_get_ds_lk`, `api_create_lk`, `api_update_lk/{id}`, `api_delete_lk/{id}` |
| Lỗ hổng | `api_get_ds_lh`, `api_create_lh`, `api_update_lh/{id}`, `api_delete_lh/{id}` |
| Nhật ký lỗi | `api_get_ds_nkl`, `api_create_nkl`, `api_update_nkl/{id}`, `api_phan_cong_nv_xuly_loi/{id}`, `api_delete_nkl/{id}` |
| Báo cáo | `api_get_bao_cao_tong_quan`, `api_get_tong_loi_nv_xu_ly`, `api_get_kpi_nhan_vien`, `api_get_tinh_trang_lo_hong`, `api_get_lo_hong_theo_thiet_bi` |
| Backup/import/export | `api_backup_database`, `api_restore_database`, `api_export_table/{model}`, `api_import_table/{model}` |
| Chatbot | `api_chatbot_ask` |
| Giám sát mạng | Socket.IO `/socket.io`, `api_network_monitor_snapshot`, `api_network_diagnostics/{id}` |

Chi tiết method, field, quyền và cấu trúc payload chuẩn nằm trong
[README Backend](../../TelecomManagement_BE/README.md) và Swagger tại
`/qlmvt/swagger/`. FE gửi file JSON cho import/export và backup/restore;
restore chỉ thêm bản ghi mới, không xóa hoặc ghi đè bản ghi đã tồn tại.

## Chatbot AI

Frontend gửi `{ message, history }` và nhận câu trả lời trực tiếp từ
`POST /qlmvt/api_chatbot_ask/`; không phụ thuộc WebSocket. API key, model và
base URL tương thích OpenAI chỉ được cấu hình ở `.env` backend. Chatbot hiểu
tiếng Việt và tiếng Anh nhưng luôn trả lời bằng tiếng Việt.

Chatbot chỉ thực thi công cụ đọc; nhân viên chỉ xem được sự cố/lỗ hổng đã giao
và hồ sơ của mình. Admin có thể yêu cầu rõ ràng để xuất backup JSON, được tải
xuống trên trình duyệt; backup không được chuyển tới provider. Yêu cầu ghi dữ
liệu chỉ nhận hướng dẫn theo quyền, không tạo/cập nhật/xóa dữ liệu. Câu hỏi,
history và các kết quả đọc được gửi đến provider AI đã cấu hình; không gửi API
key hoặc nội dung backup.

## Giới hạn backend hiện tại

- Chưa có API 2FA, audit/system logs, settings, backup history hoặc database
  statistics; các màn hình/đường dẫn này không gọi endpoint giả.
- Socket.IO gửi trạng thái ICMP tới IP đã đăng ký và chỉ số hiệu suất gần nhất
  đã lưu. CPU/RAM/nhiệt độ và trạng thái liên kết vật lý/điều khiển mạng cần
  agent, SNMP hoặc controller; hiện chưa có nguồn dữ liệu tương ứng.
- Một số bố cục bản đồ chỉ lưu cục bộ trên trình duyệt.
- KPI/báo cáo chỉ hiển thị số liệu mà backend hiện có. Không suy diễn uptime hoặc
  băng thông capacity từ dữ liệu không được API cung cấp.
