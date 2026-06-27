const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  // Lấy dữ liệu cần thiết
  const orders = await knex("orders").select("id");
  const products = await knex("products").select("id", "name", "price");

  // Lấy các khuyến mãi đang active
  const activePromos = await knex("promotions")
    .where("is_active", true)
    .where("start_date", "<=", new Date())
    .where("end_date", ">=", new Date());

  const productPromos = await knex("product_promotions").select("*");

  if (orders.length === 0 || products.length === 0) {
    console.log("Không có đơn hàng hoặc sản phẩm để seed!");
    return;
  }

  const data = [];

  // Xử lý logic seed dựa trên bảng promotion
  for (const order of orders) {
    const numberOfItems = faker.number.int({ min: 1, max: 3 });
    const selectedProducts = faker.helpers.arrayElements(
      products,
      numberOfItems,
    );

    for (const product of selectedProducts) {
      const quantity = faker.number.int({ min: 1, max: 3 });
      const basePrice = Number(product.price);

      // Kiểm tra xem sản phẩm có nằm trong danh sách khuyến mãi không
      const promoMapping = productPromos.find(
        (pp) => pp.product_id === product.id,
      );
      let unitPrice = basePrice;
      let discountAmountPerUnit = 0;

      if (promoMapping) {
        const promo = activePromos.find(
          (p) => p.id === promoMapping.promotion_id,
        );
        if (promo) {
          // Tính giảm giá theo loại trong bảng promotions
          if (promo.discount_type === "percent") {
            discountAmountPerUnit = Math.floor(
              basePrice * (Number(promo.discount_value) / 100),
            );
          } else if (promo.discount_type === "fixed") {
            discountAmountPerUnit = Number(promo.discount_value);
          }
          unitPrice = basePrice - discountAmountPerUnit;
        }
      }

      data.push({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        base_price: basePrice,
        unit_price: unitPrice,
        quantity: quantity,
        discount_amount: discountAmountPerUnit * quantity,
        final_price: unitPrice * quantity,
      });
    }
  }

  // Thực hiện insert vào database
  await knex("order_items").del();
  await knex("order_items").insert(data);

  // Cập nhật tổng tiền cho bảng orders
  for (const order of orders) {
    const items = await knex("order_items").where("order_id", order.id);
    const total = items.reduce(
      (sum, item) => sum + Number(item.final_price),
      0,
    );
    await knex("orders").where("id", order.id).update({ total_amount: total });
  }
};
