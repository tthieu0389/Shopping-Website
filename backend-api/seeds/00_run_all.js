const users = require("./data/01_users");
const profiles = require("./data/02_user_profiles");
const addresses = require("./data/03_user_addresses");
const payments = require("./data/04_user_payment_methods");
const stores = require("./data/05_stores");
const categories = require("./data/06_categories");
const promotions = require("./data/07_promotions");
const blogs = require("./data/08_blogs");
const contacts = require("./data/09_contacts");
const products = require("./data/10_products");
const productDetails = require("./data/11_product_details");
const productImages = require("./data/12_product_images");
const productPromotions = require("./data/13_product_promotions");
const inventory = require("./data/14_inventory");
const inventoryLogs = require("./data/15_inventory_logs");
const carts = require("./data/16_carts");
const cartItems = require("./data/17_cart_items");
const orders = require("./data/18_orders");
const orderItems = require("./data/19_order_items");
const favorites = require("./data/20_favorites");
const reviews = require("./data/21_reviews");

exports.seed = async function (knex) {
  await knex.transaction(async (trx) => {
    // ===== XÓA DỮ LIỆU CŨ (thứ tự ngược FK) =====
    await trx("reviews").del();
    await trx("favorites").del();
    await trx("order_items").del();
    await trx("orders").del();
    await trx("cart_items").del();
    await trx("carts").del();
    await trx("inventory_logs").del();
    await trx("inventory").del();
    await trx("product_promotions").del();
    await trx("product_images").del();
    await trx("product_details").del();
    await trx("products").del();
    await trx("blogs").del();
    await trx("contacts").del();
    await trx("promotions").del();
    await trx("categories").del();
    await trx("stores").del();
    await trx("user_payment_methods").del();
    await trx("user_addresses").del();
    await trx("user_profiles").del();
    await trx("users").del();

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
