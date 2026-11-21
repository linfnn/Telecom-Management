# Cài đặt hệ thống

Backend hiện không khai báo endpoint cấu hình hệ thống. Vì vậy FE không cung cấp
trang chỉnh setting và không gửi các request `/api/settings` không tồn tại.

Để cấu hình backend, dùng các biến môi trường được mô tả trong
[README Backend](../../TelecomManagement_BE/README.md) và
`TelecomManagement_BE/.env.example`. Không thay đổi schema MSSQL từ Frontend.
