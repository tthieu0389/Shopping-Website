const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 1. Đảm bảo folder tồn tại
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

// 3. File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedImageTypes.includes(file.mimetype)) {
    const err = new Error("Only JPG, PNG, WEBP files are allowed");
    err.code = "INVALID_FILE_TYPE";
    return cb(err, false); // Trả lỗi về cho Multer xử lý tập trung bên dưới
  }

  cb(null, true);
};

// 4. Tạo instance gốc của Multer (Để private nội bộ trong file này)
const multerInstance = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // Giới hạn 4MB/file của bạn
  },
  fileFilter,
});

// 5. Hàm helper dùng để bọc và bắt lỗi tự động cho các method của Multer
const wrapMulterMethod = (multerMethod) => {
  return (req, res, next) => {
    multerMethod(req, res, (err) => {
      if (err) {
        let errorMessage = err.message;

        // Bắt lỗi vượt quá dung lượng 4MB
        if (err.code === "LIMIT_FILE_SIZE") {
          errorMessage = "File quá lớn. Tối đa chỉ được cho phép 4MB mỗi file.";
        }
        // Bắt lỗi up quá số lượng file quy định (ví dụ truyền quá 10 ảnh)
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          errorMessage = "Số lượng file vượt quá giới hạn cho phép.";
        }

        // Trả về JSON lỗi đồng nhất thay vì làm sập app hoặc trả về HTML lỗi
        return res.status(400).json({
          success: false,
          message: "Upload error",
          error: errorMessage,
        });
      }

      // Nếu không có lỗi gì, đi tiếp sang middleware/controller sau
      next();
    });
  };
};

// 6. Export ra một object giả lập cấu trúc của Multer nhưng đã được bọc bắt lỗi
module.exports = {
  single: (fieldName) => wrapMulterMethod(multerInstance.single(fieldName)),
  array: (fieldName, maxCount) =>
    wrapMulterMethod(multerInstance.array(fieldName, maxCount)),
  fields: (fieldsArray) => wrapMulterMethod(multerInstance.fields(fieldsArray)),
  none: () => wrapMulterMethod(multerInstance.none()),
  any: () => wrapMulterMethod(multerInstance.any()),
};
