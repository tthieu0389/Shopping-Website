const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const users = await knex("users").select("id");

  const data = users.map((u) => ({
    user_id: u.id,
    bank_name: faker.company.name(),
    card_holder_name: faker.person.fullName(),
    card_last4: faker.finance.accountNumber(4).slice(0, 4),
    payment_type: "card",
    provider: faker.helpers.arrayElement([
      "visa",
      "mastercard",
      "bank",
      "momo",
      "vnpay",
    ]),
    expiry_month: faker.number.int({ min: 1, max: 12 }),
    expiry_year: faker.number.int({ min: 2026, max: 2035 }),
    is_default: true,
  }));

  await knex("user_payment_methods").insert(data);
};
