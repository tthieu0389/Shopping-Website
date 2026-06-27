const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");
  const stores = await knex("stores").select("id");
  const addresses = await knex("user_addresses").select("id", "user_id");

  if (addresses.length === 0) {
    console.log("Vui lòng seed bảng 'user_addresses' trước khi seed 'orders'!");
    return;
  }

  const data = Array.from({ length: 5 }, () => {
    const user = faker.helpers.arrayElement(users);

    // Lấy địa chỉ thuộc đúng user này
    const userAddresses = addresses.filter((a) => a.user_id === user.id);
    const address = faker.helpers.arrayElement(userAddresses);

    return {
      order_code: faker.string.alphanumeric(8).toUpperCase(),
      user_id: user.id,
      address_id: address.id,
      pickup_store_id: faker.helpers.arrayElement(stores).id,
      receiver_name: faker.person.fullName(),
      receiver_phone: faker.phone.number(),
      shipping_address: faker.location.streetAddress(),
      total_amount: faker.number.int({ min: 100000, max: 5000000 }),
      payment_method: "cash",
      status: "pending",
      note: faker.lorem.sentence(),
    };
  });

  await knex("orders").insert(data).onConflict("order_code").ignore();
};
