const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");

  const data = users.map((u) => ({
    user_id: u.id,
    bank_name: faker.company.name(),
    card_holder_name: faker.person.fullName(),
    card_last4: faker.finance.accountNumber(4),
    is_default: true,
  }));

  await knex("user_payment_methods").insert(data);
};
