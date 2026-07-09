# Shopping Website — Dự án thực tập

Hệ thống thương mại điện tử xây dựng phục vụ mục đích **học tập và thực tập**, bao gồm REST API (Node.js/Express) và Single Page Application (React/Vite).

> Dự án được thực hiện trong khuôn khổ thực tập tại **Tập đoàn Bưu chính Viễn thông Việt Nam — VNPT Cần Thơ**
> 📍 Số 2 Nguyễn Trãi, Ninh Kiều, Cần Thơ, Việt Nam

---

## ⚠️ Tuyên bố miễn trừ trách nhiệm về thương hiệu / Trademark Disclaimer

> **Tiếng Việt**
>
> Dự án này sử dụng tên thương hiệu **VNPT**, logo **VNPT** và các dấu hiệu nhận diện liên quan (màu sắc, tên sản phẩm, v.v.) **chỉ với mục đích minh hoạ trong khuôn khổ học tập / thực tập**.
>
> - **VNPT** là thương hiệu đã đăng ký của **Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT)**.
> - Logo VNPT hiển thị trong ứng dụng được lấy từ Wikimedia Commons theo giấy phép công khai (public domain / fair use cho mục đích giáo dục); không có hình ảnh nào được lấy trực tiếp từ hệ thống của VNPT.
> - Dự án này **không có sự liên kết, bảo lãnh hay phê duyệt** từ VNPT dưới bất kỳ hình thức nào.
> - Dự án **không được sử dụng cho mục đích thương mại**, không phát hành công khai dưới dạng sản phẩm thực và không nhằm tạo ra sự nhầm lẫn với dịch vụ chính thức của VNPT.
> - Mọi tên sản phẩm, dữ liệu mẫu (seed data) và nội dung hiển thị liên quan đến VNPT đều là **dữ liệu giả lập** (fictional/mock data), không phản ánh thông tin thực tế.
>
> Dự án được thực hiện dưới sự hướng dẫn của đơn vị tiếp nhận thực tập là **VNPT Cần Thơ**. Việc sử dụng thương hiệu VNPT trong dự án này nằm trong phạm vi cho phép của quá trình thực tập có giám sát.
>
> Nếu có bất kỳ lo ngại nào về việc sử dụng thương hiệu, vui lòng liên hệ để xử lý ngay.

---

> **English**
>
> This project uses the **VNPT** brand name, logo, and associated visual identity (colors, product names, etc.) **solely for educational and internship demonstration purposes**.
>
> - **VNPT** is a registered trademark of **Vietnam Posts and Telecommunications Group (VNPT)**.
> - The VNPT logo displayed in the application is sourced from Wikimedia Commons under a public license; no assets were taken directly from VNPT's own systems.
> - This project is **not affiliated with, endorsed by, or approved by VNPT** in any way.
> - This project is **not used for commercial purposes**, is not publicly released as a real product, and is not intended to cause confusion with official VNPT services.
> - All product names, seed data, and VNPT-related content displayed in the application are **fictional mock data** and do not reflect actual VNPT information.
>
> This project was carried out under the supervision of **VNPT Can Tho** (the internship host). The use of the VNPT brand within this project falls within the scope permitted by the supervised internship arrangement.
>
> If you have any concerns regarding trademark usage, please reach out and it will be addressed promptly.

---

## Thành viên nhóm

| Họ và tên         | MSSV     | Vai trò                 |
| ----------------- | -------- | ----------------------- |
| Hồ Ngọc Hiển      | B2205981 | UI/UX Design, Frontend  |
| Trần Trung Hiếu   | B2205980 | Database, Backend       |
| Nguyễn Thanh Bình | B2105696 | Tester (Manual Testing) |

---

## Tổng quan dự án

| Thành phần   | Công nghệ                               | Thư mục         |
| ------------ | --------------------------------------- | --------------- |
| Backend API  | Node.js, Express 5, PostgreSQL, Knex.js | `backend-api/`  |
| Frontend SPA | React 19, Vite, Tailwind CSS, Zustand   | `frontend-spa/` |

---

## Tech Stack

**Backend**

- Node.js 18+, Express 5
- PostgreSQL 13+, Knex.js (query builder + migrations)
- JWT (xác thực), bcrypt (mã hoá mật khẩu)
- Zod (validate đầu vào), Helmet + CORS + rate-limit (bảo mật HTTP)
- Swagger / OpenAPI 3.0 (tài liệu API)

**Frontend**

- React 19, React Router v7
- Tailwind CSS v4
- Zustand (state management), React Hook Form + Zod (form/validate)
- Axios (HTTP client)

---

## Tính năng chính

- Xác thực người dùng (đăng ký, đăng nhập, JWT)
- Quản lý tài khoản, hồ sơ, địa chỉ, phương thức thanh toán
- Danh mục & sản phẩm (thông số kỹ thuật, hình ảnh, tìm kiếm, lọc)
- Giỏ hàng, đặt hàng, theo dõi đơn hàng
- Khuyến mãi / Flash Sale
- Đánh giá sản phẩm (có xác minh đã mua hàng)
- Sản phẩm yêu thích
- Blog & bình luận
- Liên hệ / hỗ trợ khách hàng
- Quản lý tồn kho với lịch sử log
- Giao diện quản trị (Admin) và nhân viên (Staff)

---

## Cài đặt & Chạy dự án

### Yêu cầu hệ thống

- Node.js 18+
- PostgreSQL 13+

### Backend

```bash
cd backend-api
npm install
```

Tạo file `.env` (xem mẫu bên dưới):

```env
PORT=3000

# KẾT NỐI DATABASE CHÍNH (SQL)
DB_HOST=your_database_host
DB_PORT=5432
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name

# BẢO MẬT JWT
JWT_SECRET=your_jwt_secret

# MÔI TRƯỜNG CHẠY: Sửa thành production khi deploy thực tế
NODE_ENV=development

# ĐỊA CHỈ FRONTEND: Dán link ngrok hoặc domain thực tế của Frontend vào đây khi deploy
CLIENT_URL=http://localhost:5173

# BẬT SWAGGER Ở PRODUCTION (chỉ debug tạm, vẫn yêu cầu đăng nhập admin): true/false
ENABLE_SWAGGER_IN_PROD=false
```

Khởi tạo database và chạy migration:

```bash
npm run migrate:latest
```

Chạy server:

```bash
# Development (tự restart khi code thay đổi)
npm run dev

# Production
npm start
```

Server chạy tại `http://localhost:3000`. Tài liệu Swagger tại `http://localhost:3000/api-docs`.

### Frontend

```bash
cd frontend-spa
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

---

## Phân quyền

Hệ thống có 3 vai trò: `user`, `staff`, `admin`. Phân quyền được kiểm soát ở tầng route thông qua middleware `verifyToken` và `checkRole`.

---

## Mục đích sử dụng

Dự án được xây dựng hoàn toàn phục vụ **học tập và thực tập**. Không phát hành thương mại, không triển khai production công khai.
