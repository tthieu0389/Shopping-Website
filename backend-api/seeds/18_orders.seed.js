const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");
  const stores = await knex("stores").select("id", "province");
  const addresses = await knex("user_addresses").select(
    "id",
    "user_id",
    "province",
  );

  if (addresses.length === 0 || stores.length === 0) {
    console.log("Cần dữ liệu user_addresses và stores để seed orders!");
    return;
  }

  const data = [];

  for (let i = 0; i < 20; i++) {
    const user = faker.helpers.arrayElement(users);
    const userAddresses = addresses.filter((a) => a.user_id === user.id);

    // Random chọn hình thức: 70% giao hàng, 30% nhận tại cửa hàng
    const isDelivery = faker.datatype.boolean(0.7);
    let shippingFee = 0;
    let address = null;
    let pickupStoreId = null;

    if (isDelivery && userAddresses.length > 0) {
      address = faker.helpers.arrayElement(userAddresses);
      // Logic tính phí ship giống service: 15k nếu cùng tỉnh, 25k nếu khác
      const storeInProvince = stores.find(
        (s) => s.province === address.province,
      );
      shippingFee = storeInProvince ? 15000 : 25000;
    } else {
      pickupStoreId = faker.helpers.arrayElement(stores).id;
      shippingFee = 0;
    }

    const orderAmount = faker.number.int({ min: 100000, max: 2000000 });

    data.push({
      order_code: `ORD-${Date.now()}-${i}-${user.id}`,
      user_id: user.id,
      address_id: address ? address.id : null,
      pickup_store_id: pickupStoreId,
      receiver_name: address ? address.receiver_name : faker.person.fullName(),
      receiver_phone: address ? address.phone : faker.phone.number(),
      shipping_address: address ? address.address_line : "Nhận tại cửa hàng",
      shipping_fee: shippingFee,
      total_amount: orderAmount + shippingFee, // Tổng tiền = Giá hàng + phí ship
      payment_method: faker.helpers.arrayElement(["cod", "bank_transfer"]),
      status: faker.helpers.arrayElement([
        "pending",
        "confirmed",
        "shipping",
        "completed",
      ]),
      note: faker.lorem.sentence(),
    });
  }

  await knex("orders").del(); // Xóa cũ để tránh lỗi unique
  await knex("orders").insert(data);
};
