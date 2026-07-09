const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fromFile } = require("file-type");

const baseUploadDir = path.join(process.cwd(), "public/uploads");

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

// File filter (dùng chung cho mọi subfolder)
// Chi check nhanh dua vao header MIME client gui len (khong tin cay hoan toan,
// spoof duoc de dang bang cach doi Content-Type khi upload)
const fileFilter = (req, file, cb) => {
  if (!allowedImageTypes.includes(file.mimetype)) {
    const err = new Error("Only JPG, PNG, WEBP files are allowed");
    err.code = "INVALID_FILE_TYPE";
    return cb(err, false); // Trả lỗi về cho Multer xử lý tập trung bên dưới
  }

  cb(null, true);
};

// Kiem tra that: doc magic bytes cua file da luu tren disk sau khi multer ghi xong,
// xoa file va tra loi neu noi dung thuc te khong phai anh hop le
// (chan truong hop doi ten .php/.html thanh .jpg de bypass MIME check o tren)
const verifyMagicBytes = async (req, res, next) => {
  const files = req.files
    ? Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat()
    : req.file
      ? [req.file]
      : [];

  if (files.length === 0) return next();

  try {
    for (const file of files) {
      const type = await fromFile(file.path);

      if (!type || !allowedImageTypes.includes(type.mime)) {
        // Xoa toan bo file da upload trong request nay (tranh rac tren disk)
        for (const f of files) {
          fs.unlink(f.path, () => {});
        }
        return res.status(400).json({
          success: false,
          message: "Upload error",
          error:
            "Nội dung file không hợp lệ (không phải ảnh JPG/PNG/WEBP thực sự).",
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Hàm helper dùng để bọc và bắt lỗi tự động cho các method của Multer
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

      // Khong co loi tu Multer, chuyen sang buoc verify magic bytes
      // truoc khi cho di tiep sang middleware/controller sau
      verifyMagicBytes(req, res, next);
    });
  };
};

const createUploader = (subfolder = "") => {
  const uploadDir = path.join(baseUploadDir, subfolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

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

  const multerInstance = multer({
    storage,
    limits: {
      fileSize: 4 * 1024 * 1024, // Giới hạn 4MB/file
    },
    fileFilter,
  });

  return {
    single: (fieldName) => wrapMulterMethod(multerInstance.single(fieldName)),
    array: (fieldName, maxCount) =>
      wrapMulterMethod(multerInstance.array(fieldName, maxCount)),
    fields: (fieldsArray) =>
      wrapMulterMethod(multerInstance.fields(fieldsArray)),
    none: () => wrapMulterMethod(multerInstance.none()),
    any: () => wrapMulterMethod(multerInstance.any()),
  };
};

// Mặc định: lưu thẳng vào public/uploads (giữ tương thích các route đang gọi
// upload.single(...) / upload.array(...) trực tiếp không qua subfolder).
const defaultUploader = createUploader();

module.exports = Object.assign(createUploader, defaultUploader);
