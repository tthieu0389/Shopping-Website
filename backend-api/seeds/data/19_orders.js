const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  // Lấy thêm role để xác định staff
  const users = await knex("users").select("id", "name", "role");
  const profiles = await knex("user_profiles").select("user_id", "phone");
  const stores = await knex("stores").select("id", "province", "address");
  const addresses = await knex("user_addresses").select(
    "id",
    "user_id",
    "province",
    "receiver_name",
    "phone",
    "address_line",
  );

  if (addresses.length === 0 || stores.length === 0) {
    console.log("Cần dữ liệu user_addresses và stores để seed orders!");
    return;
  }

  // Danh sách nhân viên
  const staffUsers = users.filter((u) => u.role === "staff");

  const data = [];

  for (let i = 0; i < 20; i++) {
    const user = faker.helpers.arrayElement(users);
    const userAddresses = addresses.filter((a) => a.user_id === user.id);

    // 70% giao hàng - 30% nhận tại cửa hàng
    const isDelivery = faker.datatype.boolean(0.7);

    let shippingFee = 0;
    let address = null;
    let pickupStoreId = null;

    if (isDelivery && userAddresses.length > 0) {
      address = faker.helpers.arrayElement(userAddresses);

      // Tính phí ship
      const storeInProvince = stores.find(
        (s) => s.province === address.province,
      );

      shippingFee = storeInProvince ? 15000 : 25000;
    } else {
      pickupStoreId = faker.helpers.arrayElement(stores).id;
      shippingFee = 0;
    }

    // 30% đơn được tạo bởi staff
    const isStaffOrder = faker.datatype.boolean(0.3) && staffUsers.length > 0;

    const orderAmount = faker.number.int({
      min: 100000,
      max: 2000000,
    });

    const pickupStore = pickupStoreId
      ? stores.find((s) => s.id === pickupStoreId)
      : null;

    const userProfile = profiles.find((p) => p.user_id === user.id);

    data.push({
      order_code: `ORD-${Date.now()}-${i}-${user.id}`,
      user_id: user.id,

      address_id: address ? address.id : null,
      pickup_store_id: pickupStoreId,

      receiver_name: address ? address.receiver_name : user.name,

      receiver_phone: address ? address.phone : userProfile?.phone || null,

      shipping_address: address
        ? address.address_line
        : pickupStore?.address || null,

      shipping_fee: shippingFee,
      total_amount: orderAmount + shippingFee,

      payment_method: faker.helpers.arrayElement(["cod", "bank_transfer"]),

      status: faker.helpers.arrayElement([
        "pending",
        "confirmed",
        "shipping",
        "completed",
      ]),

      // Thêm staff tạo đơn
      created_by_staff_id: isStaffOrder
        ? faker.helpers.arrayElement(staffUsers).id
        : null,

      note: faker.lorem.sentence(),
    });
  }

  // Xóa dữ liệu cũ
  await knex("orders").del();

  // Seed dữ liệu mới
  await knex("orders").insert(data);
};
