const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  // Lấy danh sách ID đơn hàng và sản phẩm hiện có
  const orders = await knex("orders").select("id");
  const products = await knex("products").select("id", "name", "price");

  if (orders.length === 0 || products.length === 0) {
    console.log("Không có đơn hàng hoặc sản phẩm để tạo seed!");
    return;
  }

  const data = [];

  // Tạo dữ liệu giả lập cho order_items
  for (const order of orders) {
    const product = faker.helpers.arrayElement(products);
    const quantity = faker.number.int({ min: 1, max: 3 });
    const unitPrice = Number(product.price);

    // Giả lập discount (từ 0 đến 10% giá sản phẩm)
    const discountAmount = Math.floor(unitPrice * 0.1);
    const finalPrice = (unitPrice - discountAmount) * quantity;

    data.push({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_price: unitPrice, // Giá gốc
      quantity: quantity,
      price: finalPrice, // Giá sau giảm (final_price)
      discount_amount: discountAmount * quantity,
    });
  }

  await knex("order_items").insert(data);

  for (const order of orders) {
    const items = await knex("order_items").where("order_id", order.id);
    const total = items.reduce((sum, item) => sum + Number(item.price), 0);

    await knex("orders").where("id", order.id).update({ total_amount: total });
  }

  console.log(
    "Seed order_items thành công và đã cập nhật total_amount cho orders!",
  );
};
