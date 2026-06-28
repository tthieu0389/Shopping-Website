/**
 * Tạo mã đơn hàng duy nhất theo format chuẩn.
 * Dùng chung cho cả order.service và cart.service để đảm bảo nhất quán.
 * Format: ORD-{timestamp}-{userId}-{random4chars}
 */
const generateOrderCode = (userId) =>
  `ORD-${Date.now()}-${userId}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

module.exports = generateOrderCode;
