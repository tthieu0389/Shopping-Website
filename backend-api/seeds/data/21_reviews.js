const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  // Chỉ review sản phẩm mà user đó đã có order completed
  const completedOrderItems = await knex("order_items as oi")
    .join("orders as o", "oi.order_id", "o.id")
    .where("o.status", "completed")
    .select("o.user_id", "oi.product_id");

  if (completedOrderItems.length === 0) {
    console.log("Không có đơn hàng completed để seed reviews!");
    return;
  }

  // Group theo user_id
  const userProductMap = {};
  for (const row of completedOrderItems) {
    if (!userProductMap[row.user_id]) userProductMap[row.user_id] = new Set();
    userProductMap[row.user_id].add(row.product_id);
  }

  const seen = new Set();
  const data = [];

  for (const [userId, productIds] of Object.entries(userProductMap)) {
    const productArray = [...productIds];
    // Mỗi user review tối đa 3 sản phẩm đã mua
    const picked = faker.helpers.arrayElements(productArray, {
      min: 1,
      max: Math.min(3, productArray.length),
    });

    for (const productId of picked) {
      const key = `${userId}_${productId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      data.push({
        user_id: Number(userId),
        product_id: productId,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.sentence(),
        is_deleted: false,
      });
    }
  }

  if (data.length === 0) {
    console.log("Không có dữ liệu review để insert!");
    return;
  }

  await knex("reviews")
    .insert(data)
    .onConflict(["user_id", "product_id"])
    .ignore();

  console.log(`Seeded ${data.length} reviews.`);
};
