const users = require("./data/01_users");
const profiles = require("./data/02_user_profiles");
const addresses = require("./data/03_user_addresses");
const payments = require("./data/04_user_payment_methods");
const stores = require("./data/05_stores");
const categories = require("./data/06_categories");
const promotions = require("./data/07_promotions");
const blogs = require("./data/08_blogs");
const blogImages = require("./data/09_blog_images");
const contacts = require("./data/10_contacts");
const products = require("./data/11_products");
const productDetails = require("./data/12_product_details");
const productImages = require("./data/13_product_images");
const productPromotions = require("./data/14_product_promotions");
const inventory = require("./data/15_inventory");
const inventoryLogs = require("./data/16_inventory_logs");
const carts = require("./data/17_carts");
const cartItems = require("./data/18_cart_items");
const orders = require("./data/19_orders");
const orderItems = require("./data/20_order_items");
const favorites = require("./data/21_favorites");
const reviews = require("./data/22_reviews");

exports.seed = async function (knex) {
  await knex.transaction(async (trx) => {
    // ===== XÓA DỮ LIỆU CŨ + RESET ID =====
    await trx.raw(`
      TRUNCATE TABLE
        reviews, favorites, order_items, orders,
        cart_items, carts, inventory_logs, inventory,
        product_promotions, product_images, product_details, products,
        blog_images, blogs, contacts, promotions, categories, stores,
        user_payment_methods, user_addresses, user_profiles, users
      RESTART IDENTITY CASCADE
    `);

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
    await blogImages.seed(trx); // phai chay sau blogs de co blog.id
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
