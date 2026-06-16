const users = require("./01_users.seed");
const profiles = require("./02_user_profiles.seed");
const addresses = require("./03_user_addresses.seed");
const payments = require("./04_user_payment_methods.seed");

const stores = require("./05_stores.seed");
const categories = require("./06_categories.seed");
const promotions = require("./07_promotions.seed");
const blogs = require("./08_blogs.seed");
const contacts = require("./09_contacts.seed");

const products = require("./10_products.seed");
const productDetails = require("./11_product_details.seed");
const productImages = require("./12_product_images.seed");
const productPromotions = require("./13_product_promotions.seed");

const inventory = require("./14_inventory.seed");
const inventoryLogs = require("./15_inventory_logs.seed");

const carts = require("./16_carts.seed");
const cartItems = require("./17_cart_items.seed");

const orders = require("./18_orders.seed");
const orderItems = require("./19_order_items.seed");

const favorites = require("./20_favorites.seed");
const reviews = require("./21_reviews.seed");

exports.seed = async function (knex) {
  await knex.transaction(async (trx) => {
    // ===== USERS CORE =====
    await users.seed(trx);
    await profiles.seed(trx);
    await addresses.seed(trx);
    await payments.seed(trx);

    // ===== STATIC DATA =====
    await stores.seed(trx);
    await categories.seed(trx);
    await promotions.seed(trx);
    await blogs.seed(trx);
    await contacts.seed(trx);

    // ===== PRODUCT SYSTEM =====
    await products.seed(trx);
    await productDetails.seed(trx);
    await productImages.seed(trx);
    await productPromotions.seed(trx);

    // ===== INVENTORY =====
    await inventory.seed(trx);
    await inventoryLogs.seed(trx);

    // ===== CART =====
    await carts.seed(trx);
    await cartItems.seed(trx);

    // ===== ORDER =====
    await orders.seed(trx);
    await orderItems.seed(trx);

    // ===== SOCIAL =====
    await favorites.seed(trx);
    await reviews.seed(trx);
  });
};
