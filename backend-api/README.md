# Shopping Website API

REST API cho hệ thống thương mại điện tử, xây dựng trên Node.js, Express và PostgreSQL. Dự án cung cấp đầy đủ nghiệp vụ cho một sàn bán lẻ: quản lý sản phẩm, tồn kho, đơn hàng, khuyến mãi, đánh giá và các module hỗ trợ vận hành khác, phục vụ cả phía khách hàng lẫn phía quản trị.

## Tech Stack

- Node.js, Express 5
- PostgreSQL, Knex.js (query builder + migrations)
- JSON Web Token (JWT) cho xác thực, bcrypt/bcryptjs cho mã hoá mật khẩu
- Zod cho validate dữ liệu đầu vào
- Helmet, CORS, express-rate-limit cho bảo mật tầng HTTP
- Swagger (OpenAPI 3.0) cho tài liệu API
- Jest cho kiểm thử, ESLint/Prettier cho chuẩn hoá code

## Tính năng chính

Hệ thống được chia theo module nghiệp vụ, mỗi module có route riêng và áp dụng rate limit độc lập:

- **Auth**: đăng ký, đăng nhập, xác thực bằng JWT
- **Users / User Profile / User Address / User Payment**: quản lý tài khoản, hồ sơ cá nhân, địa chỉ giao hàng, phương thức thanh toán
- **Categories / Products / Product Details / Product Images**: quản lý danh mục và sản phẩm, bao gồm thông số kỹ thuật và hình ảnh
- **Cart**: giỏ hàng
- **Orders / Order Items**: xử lý đơn hàng và chi tiết đơn hàng
- **Inventory / Inventory Logs**: quản lý tồn kho theo trạng thái (active/inactive/archived) và lịch sử xuất - nhập - điều chỉnh
- **Promotions / Product Promotions**: khuyến mãi và liên kết khuyến mãi với sản phẩm
- **Reviews**: đánh giá sản phẩm, có xác minh đã mua hàng, danh sách nổi bật cho trang chủ và trang quản trị dành cho admin
- **Favorites**: sản phẩm yêu thích
- **Blogs / Blog Images**: bài viết và hình ảnh blog
- **Contacts**: liên hệ / phản hồi từ khách hàng
- **Stores**: cửa hàng và điểm nhận hàng

Phân quyền được áp dụng theo vai trò (`user`, `admin`) ở tầng route thông qua middleware xác thực và kiểm tra quyền sở hữu.

## Yêu cầu hệ thống

- Node.js 18 trở lên
- PostgreSQL 13 trở lên

## Cài đặt

```bash
git clone <repository-url>
cd <project-folder>
npm install
```

Tạo file `.env` ở thư mục gốc với các biến môi trường sau:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=shopping_db

JWT_SECRET=your_jwt_secret
```

`JWT_SECRET` dùng để ký và xác thực token đăng nhập (xem `middlewares/verifyToken.js`), nên đặt một chuỗi ngẫu nhiên đủ dài và giữ bí mật, không commit giá trị thật lên git. File `.env` cần được thêm vào `.gitignore`.

Khởi tạo cơ sở dữ liệu và chạy migration:

```bash
npm run migrate:latest
```

## Chạy dự án

```bash
# Môi trường phát triển (tự restart khi code thay đổi)
npm run dev

# Môi trường production
npm start
```

Server mặc định chạy tại `http://localhost:3000`.

## Tài liệu API

Tài liệu API được mô tả đầy đủ theo chuẩn OpenAPI 3.0, có thể xem trực tiếp qua Swagger UI sau khi khởi động server:

```
http://localhost:3000/api-docs
```

Các endpoint yêu cầu xác thực sử dụng Bearer Token (JWT) theo chuẩn `Authorization: Bearer <token>`.

## Quản lý cơ sở dữ liệu

Dự án sử dụng Knex.js để quản lý migration:

```bash
# Tạo migration mới
npm run migrate:make <ten_migration>

# Áp dụng migration mới nhất
npm run migrate:latest

# Rollback migration gần nhất
npm run migrate:rollback
```

Migration được lưu tại `src/database/migrations`.

## Bảo mật

- Helmet để thiết lập các HTTP header bảo mật
- CORS được giới hạn theo domain frontend cấu hình qua `CLIENT_URL`
- Rate limiting theo từng nhóm route để chống lạm dụng API
- Giới hạn dung lượng request body (1MB) để hạn chế tấn công từ chối dịch vụ
- Response không cache (`Cache-Control: no-store`) và tắt ETag

## Ghi chú

Dự án được xây dựng phục vụ mục đích học tập / thực tập, không phát hành hoặc sử dụng cho mục đích thương mại.
