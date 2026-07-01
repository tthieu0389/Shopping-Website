const { faker } = require("@faker-js/faker/locale/vi");

function createContact(orderIds) {
  // ~40% liên hệ có gắn với 1 đơn hàng cụ thể, còn lại là liên hệ chung
  const hasOrder = orderIds.length > 0 && faker.datatype.boolean(0.4);
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    message: faker.lorem.sentences(2),
    order_id: hasOrder ? faker.helpers.arrayElement(orderIds) : null,
  };
}

exports.seed = async function (knex) {
  const orders = await knex("orders").select("id");
  const orderIds = orders.map((o) => o.id);

  const data = Array.from({ length: 5 }, () => createContact(orderIds));

  await knex("contacts").insert(data);
};
