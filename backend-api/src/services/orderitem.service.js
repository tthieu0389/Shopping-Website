const knex = require("../database/knex");

// Tính toán lại tổng tiền của đơn hàng dựa trên final_price của các item.
const recalculateOrderTotal = async (trx, orderId) => {
  const items = await trx("order_items").where("order_id", orderId);

  const total = items.reduce((sum, item) => {
    return sum + Number(item.final_price);
  }, 0);

  await trx("orders").where("id", orderId).update({ total_amount: total });

  return total;
};

// Lấy danh sách sản phẩm trong đơn hàng (kem anh thumbnail hien tai cua san pham).
exports.getOrderItemsByOrderId = async (orderId) => {
  return knex("order_items as oi")
    .leftJoin("products as p", "oi.product_id", "p.id")
    .select(
      "oi.id",
      "oi.order_id",
      "oi.product_id",
      "oi.product_name",
      "oi.quantity",
      "oi.base_price",
      "oi.unit_price",
      "oi.discount_amount",
      "oi.final_price",
      "p.brand as brand",
    )
    .select(
      knex("product_images")
        .select("image_url")
        .whereRaw("product_id = oi.product_id")
        .where("is_thumbnail", true)
        .limit(1)
        .as("image_url"),
    )
    .where("oi.order_id", orderId);
};

// Thêm sản phẩm vào đơn hàng
exports.createOrderItem = async (trx, data) => {
  const [item] = await trx("order_items")
    .insert({
      order_id: data.order_id,
      product_id: data.product_id,
      product_name: data.product_name,
      quantity: data.quantity,
      base_price: data.base_price,
      unit_price: data.unit_price,
      discount_amount: data.discount_amount,
      final_price: data.final_price,
    })
    .returning("*");

  // Sau khi thêm, cập nhật lại tổng tiền cho đơn hàng
  await recalculateOrderTotal(trx, data.order_id);

  return item;
};
