const { faker } = require("@faker-js/faker/locale/vi");

exports.seed = async function (knex) {
  const categories = await knex("categories").select("id");

  const brands = ["VNPT", "Huawei", "Nokia", "Cisco", "iGate"];

  const data = Array.from({ length: 20 }, () => {
    const name = faker.commerce.productName();

    return {
      name,
      slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${faker.string.alphanumeric(5).toLowerCase()}`,

      description: faker.commerce.productDescription(),

      price: faker.number.int({
        min: 100000,
        max: 5000000,
      }),

      stock: faker.number.int({
        min: 0,
        max: 200,
      }),

      product_type: faker.helpers.arrayElement([
        "sim",
        "device",
        "internet",
        "tv",
        "accessory",
      ]),

      category_id: faker.helpers.arrayElement(categories).id,

      brand: faker.helpers.arrayElement(brands),

      model: faker.string.alphanumeric(8).toUpperCase(),

      attributes: {
        color: faker.helpers.arrayElement(["White", "Black", "Gray"]),
        ports: faker.number.int({
          min: 1,
          max: 8,
        }),
        speed: faker.helpers.arrayElement(["100Mbps", "1Gbps", "2.5Gbps"]),
      },

      is_available: faker.datatype.boolean(),

      is_featured: faker.datatype.boolean(),

      is_deleted: false,
    };
  });

  await knex("products").insert(data);
};
