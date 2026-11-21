# Quy chuẩn Code (Coding Conventions)

Dự án Frontend đã được cấu hình chặt chẽ và nhất quán. Cần tuân theo các nguyên tắc hiện tại:

## 1. UI Framework: Ant Design (antd)
Toàn bộ giao diện người dùng **phải sử dụng** các component của Ant Design (Typography, Card, Form, Table, Space, v.v.). Tránh việc viết thêm custom CSS/SCSS (như `style.css` hoặc `.module.css`) trừ phi không thể giải quyết bằng Ant Design.
- Sử dụng `<Typography.Text>` và `<Typography.Title>` thay vì thẻ HTML `<span>`, `<p>`, `<h1>`.
- Khai báo Layout thông qua `<Flex>`, `<Space>`, `<Row>`, và `<Col>` thay vì dùng thẻ `<div>` kèm inline style (VD: `style={{ display: 'flex' }}`).
- Dùng `<Divider>` thay cho các đường kẻ bằng border/height cứng.

## 2. Naming Conventions (Đặt tên)
- **Component & Page:** Bắt buộc dùng `PascalCase` (vd: `DevicesPage.tsx`, `ErrorTrendChart.tsx`).
- **File API / Utils:** Dùng `camelCase` (vd: `devicesApi.ts`, `axiosClient.ts`).
- **Interfaces / Types:** Dùng `PascalCase` tương đồng với định nghĩa Database của backend (vd: `Device`, `CreateDeviceRequest`). Các property model có thể tuân theo chuẩn tên cột DB tiếng Việt (vd: `MaTB`, `TenTB`).

## 3. Quản lý Đa ngôn ngữ (i18n)
Tuyệt đối không hard-code (gõ cứng) văn bản tĩnh tiếng Việt hay tiếng Anh trực tiếp vào mã HTML của Component. Tất cả các nhãn (label), tiêu đề (title), văn bản bảng (table header) đều phải sử dụng hook `useTranslation()`:
```tsx
const { t } = useTranslation();
// ...
<Button>{t("device_management.add_device.submit_btn")}</Button>
```

## 4. TypeScript
Luôn định nghĩa rõ ràng:
1. `type` hoặc `interface` cho data gửi đi (Payload/Request).
2. `type` hoặc `interface` cho data nhận về (Response).
- Hạn chế sử dụng `any`. Cột cho Table (`ColumnsType<T>`) phải được bọc type đầy đủ để tránh lỗi runtime.
