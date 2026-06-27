const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const orders = await knex("orders").select("id");
  const products = await knex("products").select("id", "name", "price");

  if (orders.length === 0 || products.length === 0) {
    console.log("Không có đơn hàng hoặc sản phẩm để tạo seed!");
    return;
  }

  const data = [];

  for (const order of orders) {
    const product = faker.helpers.arrayElement(products);
    const quantity = faker.number.int({ min: 1, max: 3 });
    const unitPrice = Number(product.price);

    const discountAmount = Math.floor(unitPrice * 0.1);
    const finalPrice = (unitPrice - discountAmount) * quantity;

    data.push({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      base_price: unitPrice,
      unit_price: unitPrice,
      quantity: quantity,
      final_price: finalPrice,
      discount_amount: discountAmount * quantity,
    });
  }

  await knex("order_items").insert(data);

  for (const order of orders) {
    const items = await knex("order_items").where("order_id", order.id);
    const total = items.reduce(
      (sum, item) => sum + Number(item.final_price),
      0,
    );

    await knex("orders").where("id", order.id).update({ total_amount: total });
  }

  console.log(
    "Seed order_items thành công và đã cập nhật total_amount cho orders!",
  );
};
