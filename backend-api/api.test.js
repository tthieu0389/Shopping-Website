const request = require("supertest");
const app = require("./src/app");
const knex = require("./src/database/knex");

// ─── Biến dùng chung giữa các test ───────────────────────────────────────────
let adminToken = "";
let userToken = "";
let adminId, userId;

let categoryId;
let productId, productDetailId, productImageId;
let inventoryId, inventoryLogId;
let cartItemId;
let orderId;
let promotionId, productPromotionId;
let reviewId, favoriteId;
let storeId;
let blogId;
let contactId;
let addressId, paymentId;

// ✅ Khai báo email ở module scope để tất cả describe đều dùng được
const adminEmail = `admin_${Date.now()}@test.com`;
const userEmail = `user_${Date.now()}@test.com`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const api = (token) => {
  const agent = request(app);
  return {
    get: (url) =>
      agent.get(url).set("Authorization", token ? `Bearer ${token}` : ""),
    post: (url, body) =>
      agent
        .post(url)
        .set("Authorization", token ? `Bearer ${token}` : "")
        .send(body),
    put: (url, body) =>
      agent
        .put(url)
        .set("Authorization", token ? `Bearer ${token}` : "")
        .send(body),
    del: (url) =>
      agent.delete(url).set("Authorization", token ? `Bearer ${token}` : ""),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTH
// ─────────────────────────────────────────────────────────────────────────────
describe("1. Auth", () => {
  // ❌ Bỏ const adminEmail / userEmail ở đây vì đã khai báo ở trên

  test("POST /api/auth/register - đăng ký admin", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Admin Test",
      email: adminEmail,
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
  });

  test("POST /api/auth/register - đăng ký user thường", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "User Test",
      email: userEmail,
      password: "password123",
    });
    expect(res.status).toBe(201);
    userId = res.body.data?.id;
  });

  test("POST /api/auth/register - thiếu field → 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "missing@test.com",
    });
    expect(res.status).toBe(400);
  });

  test("POST /api/auth/login - đăng nhập admin", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: adminEmail,
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    adminToken = res.body.token;
    adminId = res.body.user?.id;
  });

  test("POST /api/auth/login - đăng nhập user thường", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: userEmail,
      password: "password123",
    });
    expect(res.status).toBe(200);
    userToken = res.body.token;
  });

  test("POST /api/auth/login - sai mật khẩu → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: adminEmail,
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1.5. SETUP — chạy SAU Auth, TRƯỚC tất cả test còn lại
// ─────────────────────────────────────────────────────────────────────────────
describe("1.5. Setup", () => {
  test("Promote admin lên role=admin và re-login lấy token mới", async () => {
    // Cập nhật role trong DB
    const updated = await knex("users")
      .where({ email: adminEmail })
      .update({ role: "admin" });

    expect(updated).toBe(1); // đảm bảo update đúng 1 row

    // Re-login để lấy token có role=admin
    const res = await request(app).post("/api/auth/login").send({
      email: adminEmail,
      password: "password123",
    });

    expect(res.status).toBe(200);
    adminToken = res.body.token;
    adminId = res.body.user?.id;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. USERS
// ─────────────────────────────────────────────────────────────────────────────
describe("2. Users", () => {
  test("GET /api/users - admin lấy danh sách", async () => {
    const res = await api(adminToken).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/users - không có token → 401", async () => {
    const res = await api("").get("/api/users");
    expect(res.status).toBe(401);
  });

  test("GET /api/users - user thường → 403", async () => {
    const res = await api(userToken).get("/api/users");
    expect(res.status).toBe(403);
  });

  test("GET /api/users?page=1&limit=5 - phân trang", async () => {
    const res = await api(adminToken).get("/api/users?page=1&limit=5");
    expect(res.status).toBe(200);
  });

  test("POST /api/users - admin tạo user mới", async () => {
    const res = await api(adminToken).post("/api/users", {
      name: "New User",
      email: `newuser_${Date.now()}@test.com`,
      password: "password123",
      role: "user",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");
    // dùng id này để test PUT/DELETE
    if (res.body.data?.id) userId = res.body.data.id;
  });

  test("PUT /api/users/:id - admin cập nhật user", async () => {
    const res = await api(adminToken).put(`/api/users/${userId}`, {
      name: "Updated User",
      email: `updated_${Date.now()}@test.com`,
      password: "newpassword123",
      role: "user",
    });
    expect(res.status).toBe(200);
    expect(res.body.data?.name).toBe("Updated User");
  });

  test("DELETE /api/users/:id - admin xoá user", async () => {
    const res = await api(adminToken).del(`/api/users/${userId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. USER PROFILE
// ─────────────────────────────────────────────────────────────────────────────
describe("3. User Profile", () => {
  test("POST /api/user-profiles/:userId - tạo/cập nhật profile", async () => {
    const res = await api(adminToken).post(`/api/user-profiles/${adminId}`, {
      full_name: "Admin Full Name",
      phone: "0901234567",
      gender: "male",
      birthday: "1999-01-01",
      bio: "Test bio",
    });
    expect([200, 201]).toContain(res.status);
  });

  test("GET /api/user-profiles/:userId - lấy profile", async () => {
    const res = await api(adminToken).get(`/api/user-profiles/${adminId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  test("DELETE /api/user-profiles/:userId - xoá profile", async () => {
    const res = await api(adminToken).del(`/api/user-profiles/${adminId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. USER ADDRESS
// ─────────────────────────────────────────────────────────────────────────────
describe("4. User Address", () => {
  test("POST /api/user-addresses - tạo địa chỉ", async () => {
    const res = await api(adminToken).post("/api/user-addresses", {
      user_id: adminId,
      address: "123 Đường Test",
      phone: "0901234567",
      city: "Cần Thơ",
      district: "Ninh Kiều",
      ward: "An Hòa",
      is_default: true,
    });
    expect(res.status).toBe(201);
    addressId = res.body.data?.id;
  });

  test("GET /api/user-addresses/user/:userId - lấy địa chỉ", async () => {
    const res = await api(adminToken).get(
      `/api/user-addresses/user/${adminId}`,
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PUT /api/user-addresses/:id - cập nhật địa chỉ", async () => {
    const res = await api(adminToken).put(`/api/user-addresses/${addressId}`, {
      address: "456 Đường Mới",
      phone: "0901234567",
      city: "Cần Thơ",
      district: "Bình Thủy",
      ward: "Bình Thủy",
    });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/user-addresses/:id - xoá địa chỉ", async () => {
    const res = await api(adminToken).del(`/api/user-addresses/${addressId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. USER PAYMENT
// ─────────────────────────────────────────────────────────────────────────────
describe("5. User Payment", () => {
  test("POST /api/user-payments - thêm phương thức thanh toán", async () => {
    const res = await api(adminToken).post("/api/user-payments", {
      user_id: adminId,
      provider: "Visa",
      card_number: "4111111111111111",
      card_holder: "ADMIN TEST",
      expiry_month: 12,
      expiry_year: 2028,
      is_default: true,
    });
    expect(res.status).toBe(201);
    paymentId = res.body.data?.id;
  });

  test("GET /api/user-payments/user/:userId - lấy payment", async () => {
    const res = await api(adminToken).get(`/api/user-payments/user/${adminId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PUT /api/user-payments/:id - cập nhật payment", async () => {
    const res = await api(adminToken).put(`/api/user-payments/${paymentId}`, {
      card_holder: "UPDATED NAME",
      expiry_month: 6,
      expiry_year: 2029,
    });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/user-payments/:id - xoá payment", async () => {
    const res = await api(adminToken).del(`/api/user-payments/${paymentId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
describe("6. Categories", () => {
  test("GET /api/categories - lấy danh sách", async () => {
    const res = await api("").get("/api/categories");
    expect(res.status).toBe(200);
  });

  test("POST /api/categories - admin tạo danh mục", async () => {
    const res = await api(adminToken).post("/api/categories", {
      name: `Test Category ${Date.now()}`,
      description: "Mô tả danh mục test",
    });
    expect(res.status).toBe(201);
    categoryId = res.body.data?.id;
  });

  test("POST /api/categories - user thường → 403", async () => {
    const res = await api(userToken).post("/api/categories", {
      name: "Unauthorized Category",
    });
    expect(res.status).toBe(403);
  });

  test("PUT /api/categories/:id - admin cập nhật", async () => {
    const res = await api(adminToken).put(`/api/categories/${categoryId}`, {
      name: "Updated Category",
      description: "Mô tả đã cập nhật",
    });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
describe("7. Products", () => {
  test("GET /api/products - lấy danh sách", async () => {
    const res = await api("").get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/products?search=test - tìm kiếm", async () => {
    const res = await api("").get("/api/products?search=test");
    expect(res.status).toBe(200);
  });

  test("GET /api/products?category_id=1 - lọc theo danh mục", async () => {
    const res = await api("").get(`/api/products?category_id=${categoryId}`);
    expect(res.status).toBe(200);
  });

  test("POST /api/products - admin tạo sản phẩm", async () => {
    const res = await api(adminToken).post("/api/products", {
      name: `Test Product ${Date.now()}`,
      slug: `test-product-${Date.now()}`,
      description: "Mô tả sản phẩm test",
      price: 150000,
      stock: 100,
      product_type: "retail",
      category_id: categoryId,
      is_available: true,
    });
    expect(res.status).toBe(201);
    productId = res.body.data?.id;
  });

  test("POST /api/products - thiếu field bắt buộc → 400", async () => {
    const res = await api(adminToken).post("/api/products", {
      description: "Thiếu name và price",
    });
    expect(res.status).toBe(400);
  });

  test("GET /api/products/:id - lấy sản phẩm theo ID", async () => {
    const res = await api("").get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.id).toBe(productId);
  });

  test("GET /api/products/9999999 - không tồn tại → 404", async () => {
    const res = await api("").get("/api/products/9999999");
    expect(res.status).toBe(404);
  });

  test("PUT /api/products/:id - admin cập nhật sản phẩm", async () => {
    const res = await api(adminToken).put(`/api/products/${productId}`, {
      name: "Updated Product",
      price: 200000,
      is_available: false,
    });
    expect(res.status).toBe(200);
    expect(res.body.data?.name).toBe("Updated Product");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. PRODUCT DETAIL
// ─────────────────────────────────────────────────────────────────────────────
describe("8. Product Detail", () => {
  test("POST /api/product-details - tạo chi tiết sản phẩm", async () => {
    const res = await api(adminToken).post("/api/product-details", {
      product_id: productId,
      weight: "500g",
      dimensions: "10x10x5 cm",
      material: "Nhựa",
      color: "Đỏ",
      brand: "Test Brand",
    });
    expect(res.status).toBe(201);
    productDetailId = res.body.data?.id;
  });

  test("GET /api/product-details/product/:productId - lấy chi tiết", async () => {
    const res = await api("").get(`/api/product-details/product/${productId}`);
    expect(res.status).toBe(200);
  });

  test("PUT /api/product-details/:id - cập nhật chi tiết", async () => {
    const res = await api(adminToken).put(
      `/api/product-details/${productDetailId}`,
      { weight: "600g", brand: "New Brand" },
    );
    expect(res.status).toBe(200);
  });

  test("DELETE /api/product-details/:id - xoá chi tiết", async () => {
    const res = await api(adminToken).del(
      `/api/product-details/${productDetailId}`,
    );
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. PRODUCT IMAGE
// ─────────────────────────────────────────────────────────────────────────────
describe("9. Product Image", () => {
  test("GET /api/product-images/product/:productId - lấy ảnh", async () => {
    const res = await api("").get(`/api/product-images/product/${productId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Upload ảnh dùng multipart/form-data — cần file thực tế
  // test("POST /api/product-images/upload - upload ảnh", async () => {
  //   const res = await request(app)
  //     .post("/api/product-images/upload")
  //     .set("Authorization", `Bearer ${adminToken}`)
  //     .field("product_id", productId)
  //     .attach("images", "./test-assets/sample.jpg");
  //   expect(res.status).toBe(201);
  //   productImageId = res.body.data?.[0]?.id;
  // });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. INVENTORY
// ─────────────────────────────────────────────────────────────────────────────
describe("10. Inventory", () => {
  test("GET /api/inventory - lấy danh sách kho", async () => {
    const res = await api("").get("/api/inventory");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  test("POST /api/inventory - admin tạo kho", async () => {
    const res = await api(adminToken).post("/api/inventory", {
      product_id: productId,
      quantity: 50,
      low_stock_threshold: 10,
    });
    expect(res.status).toBe(201);
    inventoryId = res.body.data?.id;
  });

  test("GET /api/inventory/low-stock - hàng sắp hết (Admin)", async () => {
    const res = await api(adminToken).get("/api/inventory/low-stock");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/inventory/product/:product_id - lấy theo sản phẩm", async () => {
    const res = await api(adminToken).get(
      `/api/inventory/product/${productId}`,
    );
    expect(res.status).toBe(200);
  });

  test("PUT /api/inventory/:id - cập nhật kho", async () => {
    const res = await api(adminToken).put(`/api/inventory/${inventoryId}`, {
      quantity: 80,
      low_stock_threshold: 15,
    });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. INVENTORY LOG
// ─────────────────────────────────────────────────────────────────────────────
describe("11. Inventory Log", () => {
  test("GET /api/inventory-logs - admin lấy toàn bộ log", async () => {
    const res = await api(adminToken).get("/api/inventory-logs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/inventory-logs - không có token → 401", async () => {
    const res = await api("").get("/api/inventory-logs");
    expect(res.status).toBe(401);
  });

  test("GET /api/inventory-logs/inventory/:inventory_id - log theo kho", async () => {
    const res = await api(adminToken).get(
      `/api/inventory-logs/inventory/${inventoryId}`,
    );
    expect(res.status).toBe(200);
  });

  test("GET /api/inventory-logs/product/:product_id - log theo sản phẩm", async () => {
    const res = await api(adminToken).get(
      `/api/inventory-logs/product/${productId}`,
    );
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. STORE
// ─────────────────────────────────────────────────────────────────────────────
describe("12. Store", () => {
  test("GET /api/stores - lấy danh sách cửa hàng", async () => {
    const res = await api("").get("/api/stores");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/stores - admin tạo cửa hàng", async () => {
    const res = await api(adminToken).post("/api/stores", {
      name: "Cửa hàng Test",
      address: "123 Đường ABC",
      phone: "0901234567",
      province: "Cần Thơ",
      is_active: true,
    });
    expect(res.status).toBe(201);
    storeId = res.body.data?.id;
  });

  test("PUT /api/stores/:id - admin cập nhật cửa hàng", async () => {
    const res = await api(adminToken).put(`/api/stores/${storeId}`, {
      name: "Cửa hàng Updated",
      address: "456 Đường XYZ",
    });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/stores/:id - admin xoá cửa hàng", async () => {
    const res = await api(adminToken).del(`/api/stores/${storeId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. PROMOTION
// ─────────────────────────────────────────────────────────────────────────────
describe("13. Promotion", () => {
  test("GET /api/promotions - lấy danh sách (cần token)", async () => {
    const res = await api(userToken).get("/api/promotions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/promotions - admin tạo khuyến mãi", async () => {
    const res = await api(adminToken).post("/api/promotions", {
      code: `PROMO${Date.now()}`,
      description: "Giảm 10%",
      discount_type: "percent",
      discount_value: 10,
      start_date: "2025-01-01T00:00:00Z",
      end_date: "2025-12-31T23:59:59Z",
      is_active: true,
    });
    expect(res.status).toBe(201);
    promotionId = res.body.data?.id;
  });

  test("GET /api/promotions/:id - lấy theo ID", async () => {
    const res = await api(userToken).get(`/api/promotions/${promotionId}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.id).toBe(promotionId);
  });

  test("PUT /api/promotions/:id - admin cập nhật", async () => {
    const res = await api(adminToken).put(`/api/promotions/${promotionId}`, {
      discount_value: 15,
      description: "Giảm 15% updated",
    });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. PRODUCT PROMOTION
// ─────────────────────────────────────────────────────────────────────────────
describe("14. Product Promotion", () => {
  test("GET /api/product-promotions - lấy danh sách", async () => {
    const res = await api("").get("/api/product-promotions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/product-promotions - gán khuyến mãi cho sản phẩm", async () => {
    const res = await api("").post("/api/product-promotions", {
      product_id: productId,
      promotion_id: promotionId,
    });
    expect(res.status).toBe(201);
    productPromotionId = res.body.data?.id;
  });

  test("DELETE /api/product-promotions/:id - huỷ gán", async () => {
    const res = await api("").del(
      `/api/product-promotions/${productPromotionId}`,
    );
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. CART
// ─────────────────────────────────────────────────────────────────────────────
describe("15. Cart", () => {
  test("GET /api/cart - lấy giỏ hàng", async () => {
    const res = await api(userToken).get("/api/cart");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/cart - không có token → 401", async () => {
    const res = await api("").get("/api/cart");
    expect(res.status).toBe(401);
  });

  test("POST /api/cart - thêm sản phẩm vào giỏ", async () => {
    const res = await api(userToken).post("/api/cart", {
      product_id: productId,
      quantity: 2,
    });
    expect(res.status).toBe(201);
    cartItemId = res.body.data?.id;
  });

  test("POST /api/cart - quantity <= 0 → 400", async () => {
    const res = await api(userToken).post("/api/cart", {
      product_id: productId,
      quantity: 0,
    });
    expect(res.status).toBe(400);
  });

  test("PUT /api/cart/:id - cập nhật số lượng", async () => {
    const res = await api(userToken).put(`/api/cart/${cartItemId}`, {
      quantity: 5,
    });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/cart/:id - xoá item khỏi giỏ", async () => {
    const res = await api(userToken).del(`/api/cart/${cartItemId}`);
    expect(res.status).toBe(200);
  });

  // Thêm lại để test clear cart
  test("POST /api/cart - thêm lại để chuẩn bị clear", async () => {
    const res = await api(userToken).post("/api/cart", {
      product_id: productId,
      quantity: 1,
    });
    expect(res.status).toBe(201);
  });

  test("DELETE /api/cart/clear - xoá toàn bộ giỏ", async () => {
    const res = await api(userToken).del("/api/cart/clear");
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. ORDERS
// ─────────────────────────────────────────────────────────────────────────────
describe("16. Orders", () => {
  // Tạo địa chỉ để dùng cho order
  let orderAddressId;

  beforeAll(async () => {
    const res = await api(userToken).post("/api/user-addresses", {
      user_id: adminId, // dùng adminId vì userToken có thể là user bị xoá
      address: "Test Order Address",
      phone: "0901234567",
      city: "Cần Thơ",
      district: "Ninh Kiều",
      ward: "An Hòa",
    });
    orderAddressId = res.body.data?.id;
  });

  test("POST /api/orders - tạo đơn hàng", async () => {
    const res = await api(userToken).post("/api/orders", {
      address_id: orderAddressId,
      note: "Giao nhanh giúp tôi",
      items: [{ product_id: productId, quantity: 2 }],
    });
    expect(res.status).toBe(201);
    orderId = res.body.data?.id;
  });

  test("GET /api/orders - lấy danh sách đơn hàng", async () => {
    const res = await api(userToken).get("/api/orders");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/orders?status=pending - lọc theo trạng thái", async () => {
    const res = await api(adminToken).get("/api/orders?status=pending");
    expect(res.status).toBe(200);
  });

  test("GET /api/orders/:id - lấy đơn hàng theo ID", async () => {
    const res = await api(userToken).get(`/api/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.id).toBe(orderId);
  });

  test("GET /api/orders/9999999 - không tồn tại → 404", async () => {
    const res = await api(adminToken).get("/api/orders/9999999");
    expect(res.status).toBe(404);
  });

  test("PUT /api/orders/:id - cập nhật status + note", async () => {
    const res = await api(adminToken).put(`/api/orders/${orderId}`, {
      status: "confirmed",
      note: "Đã xác nhận đơn",
    });
    expect(res.status).toBe(200);
    expect(res.body.data?.status).toBe("confirmed");
  });

  test("POST /api/orders/:id/cancel - huỷ đơn hàng", async () => {
    const res = await api(userToken).post(`/api/orders/${orderId}/cancel`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. ORDER ITEMS
// ─────────────────────────────────────────────────────────────────────────────
describe("17. Order Items", () => {
  test("GET /api/order-items/order/:orderId - lấy items của đơn hàng", async () => {
    const res = await api(userToken).get(`/api/order-items/order/${orderId}`);
    // Có thể 200 (owner) hoặc 403 (nếu userToken đã bị xoá)
    expect([200, 403, 404]).toContain(res.status);
  });

  test("GET /api/order-items/order/:orderId - admin luôn được xem", async () => {
    const res = await api(adminToken).get(`/api/order-items/order/${orderId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/order-items/order/invalid - id không hợp lệ → 400", async () => {
    const res = await api(adminToken).get("/api/order-items/order/abc");
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. REVIEWS
// ─────────────────────────────────────────────────────────────────────────────
describe("18. Reviews", () => {
  test("POST /api/reviews - tạo đánh giá", async () => {
    const res = await api(userToken).post("/api/reviews", {
      product_id: productId,
      rating: 5,
      comment: "Sản phẩm rất tốt!",
    });
    // 201 hoặc 400 nếu đã review trước đó
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) reviewId = res.body.data?.id;
  });

  test("POST /api/reviews - không có token → 401", async () => {
    const res = await api("").post("/api/reviews", {
      product_id: productId,
      rating: 3,
    });
    expect(res.status).toBe(401);
  });

  test("GET /api/reviews/product/:productId - lấy đánh giá", async () => {
    const res = await api("").get(`/api/reviews/product/${productId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("DELETE /api/reviews/:id - xoá đánh giá", async () => {
    if (!reviewId) return; // skip nếu không tạo được
    const res = await api(userToken).del(`/api/reviews/${reviewId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 19. FAVORITES
// ─────────────────────────────────────────────────────────────────────────────
describe("19. Favorites", () => {
  test("POST /api/favorites - thêm vào yêu thích", async () => {
    const res = await api(userToken).post("/api/favorites", {
      product_id: productId,
    });
    expect([201, 400]).toContain(res.status); // 400 nếu đã có
    if (res.status === 201) favoriteId = res.body.data?.id;
  });

  test("GET /api/favorites - lấy danh sách yêu thích", async () => {
    const res = await api(userToken).get("/api/favorites");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/favorites - không có token → 401", async () => {
    const res = await api("").get("/api/favorites");
    expect(res.status).toBe(401);
  });

  test("DELETE /api/favorites/:id - xoá yêu thích", async () => {
    if (!favoriteId) return;
    const res = await api(userToken).del(`/api/favorites/${favoriteId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. BLOGS
// ─────────────────────────────────────────────────────────────────────────────
describe("20. Blogs", () => {
  const slug = `test-blog-${Date.now()}`;

  test("GET /api/blogs - lấy danh sách bài viết", async () => {
    const res = await api("").get("/api/blogs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/blogs - admin tạo bài viết", async () => {
    const res = await api(adminToken).post("/api/blogs", {
      title: "Bài viết test",
      slug,
      content: "Nội dung bài viết test rất dài...",
      is_published: true,
    });
    expect(res.status).toBe(201);
    blogId = res.body.data?.id;
  });

  test("POST /api/blogs - user thường → 403", async () => {
    const res = await api(userToken).post("/api/blogs", {
      title: "Unauthorized Blog",
      slug: `unauth-${Date.now()}`,
      content: "...",
    });
    expect(res.status).toBe(403);
  });

  test("GET /api/blogs/slug/:slug - lấy bài viết theo slug", async () => {
    const res = await api("").get(`/api/blogs/slug/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.slug).toBe(slug);
  });

  test("PUT /api/blogs/:id - admin cập nhật bài viết", async () => {
    const res = await api(adminToken).put(`/api/blogs/${blogId}`, {
      title: "Bài viết đã cập nhật",
      content: "Nội dung mới...",
    });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/blogs/:id - admin xoá bài viết", async () => {
    const res = await api(adminToken).del(`/api/blogs/${blogId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 21. CONTACTS
// ─────────────────────────────────────────────────────────────────────────────
describe("21. Contacts", () => {
  test("POST /api/contacts - gửi liên hệ (public)", async () => {
    const res = await api("").post("/api/contacts", {
      name: "Người dùng Test",
      email: "contact@test.com",
      phone: "0901234567",
      message: "Tôi cần hỗ trợ về đơn hàng",
    });
    expect(res.status).toBe(201);
    contactId = res.body.data?.id;
  });

  test("POST /api/contacts - thiếu message → 400", async () => {
    const res = await api("").post("/api/contacts", {
      name: "Test",
      email: "test@test.com",
    });
    expect(res.status).toBe(400);
  });

  test("GET /api/contacts - admin xem danh sách liên hệ", async () => {
    const res = await api(adminToken).get("/api/contacts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/contacts - user thường → 403", async () => {
    const res = await api(userToken).get("/api/contacts");
    expect(res.status).toBe(403);
  });

  test("DELETE /api/contacts/:id - admin xoá liên hệ", async () => {
    const res = await api(adminToken).del(`/api/contacts/${contactId}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 22. CLEANUP — Xoá dữ liệu test
// ─────────────────────────────────────────────────────────────────────────────
describe("22. Cleanup", () => {
  test("DELETE /api/orders/:id - admin hard delete đơn hàng test", async () => {
    if (!orderId) return;
    const res = await api(adminToken).del(`/api/orders/${orderId}`);
    expect(res.status).toBe(200);
  });

  test("DELETE /api/inventory/:id - archive kho hàng test", async () => {
    if (!inventoryId) return;
    const res = await api(adminToken).del(`/api/inventory/${inventoryId}`);
    expect(res.status).toBe(200);
  });

  test("DELETE /api/products/:id - xoá sản phẩm test", async () => {
    if (!productId) return;
    const res = await api(adminToken).del(`/api/products/${productId}`);
    expect(res.status).toBe(200);
  });

  test("DELETE /api/promotions/:id - xoá khuyến mãi test", async () => {
    if (!promotionId) return;
    const res = await api(adminToken).del(`/api/promotions/${promotionId}`);
    expect(res.status).toBe(200);
  });

  test("DELETE /api/categories/:id - xoá danh mục test", async () => {
    if (!categoryId) return;
    const res = await api(adminToken).del(`/api/categories/${categoryId}`);
    expect(res.status).toBe(200);
  });
});
