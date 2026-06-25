const { z } = require("zod");

// Định nghĩa các trường giá dùng chung để tránh lặp code
const priceSchema = z.number().nonnegative("Giá phải là số dương");

// Schema cơ bản cho dữ liệu của một mục trong đơn hàng
const baseOrderItemSchema = {
  product_id: z.number().int("ID sản phẩm phải là số nguyên"),
  product_name: z.string().min(1, "Tên sản phẩm không được để trống").max(200),
  quantity: z
    .number()
    .int()
    .min(1, "Số lượng phải ít nhất là 1")
    .max(100, "Số lượng tối đa là 100"),
  base_price: priceSchema,
  unit_price: priceSchema,
  discount_amount: priceSchema.default(0),
  final_price: priceSchema,
};

// tạo mới một dòng order_item
exports.createOrderItemSchema = z.object({
  ...baseOrderItemSchema,
  order_id: z.number().int("ID đơn hàng phải là số nguyên"),
});

// cập nhật
exports.updateOrderItemSchema = z.object({
  quantity: z.number().int().min(1).max(100).optional(),
});

// lọc/tìm kiếm danh sách order_items
exports.getOrderItemSchema = z.object({
  order_id: z.number().int().optional(),
  product_id: z.number().int().optional(),
});
