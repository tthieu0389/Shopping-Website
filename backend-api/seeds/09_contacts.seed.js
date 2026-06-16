const { faker } = require("@faker-js/faker/locale/vi");

function createContact() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    message: faker.lorem.sentences(2),
  };
}

exports.seed = async function (knex) {
  const data = Array.from({ length: 5 }, createContact);

  await knex("contacts").insert(data);
};
