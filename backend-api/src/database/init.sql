-- =========================
-- USERS & PROFILE
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_name VARCHAR(100),
    phone VARCHAR(20),
    province VARCHAR(100),
    district VARCHAR(100),
    ward VARCHAR(100),
    address_line TEXT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_default BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(100),
    card_holder_name VARCHAR(100),
    card_last4 VARCHAR(4),
    expiry_month INT,
    expiry_year INT,
    payment_type VARCHAR(50),
    provider VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =========================
-- CATEGORY & PRODUCT
-- =========================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    product_type VARCHAR(20),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(100) DEFAULT 'VNPT',
    model VARCHAR(100),
    attributes JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_thumbnail BOOLEAN DEFAULT FALSE
);

CREATE TABLE product_details (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    detail_name VARCHAR(100) NOT NULL,
    detail_value TEXT
);

CREATE INDEX idx_products_category_type ON products(category_id, product_type) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_brand_model ON products(brand, model) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_price ON products(price) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_attributes ON products USING gin (attributes);
CREATE INDEX idx_products_is_available ON products(is_available) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_deleted = FALSE;

-- =========================
-- CART
-- =========================
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id)
);

-- =========================
-- STORE
-- =========================
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =========================
-- ORDER
-- =========================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    address_id INT REFERENCES user_addresses(id) ON DELETE SET NULL,
    pickup_store_id INT REFERENCES stores(id) ON DELETE SET NULL,
    receiver_name VARCHAR(100),
    receiver_phone VARCHAR(20),
    shipping_address TEXT,
    shipping_fee NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(30) DEFAULT 'cod',
    status VARCHAR(30) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'shipping', 'completed', 'cancelled')),
    note TEXT,
    created_by_staff_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Đảm bảo mỗi đơn chỉ chọn 1 trong 2 hình thức nhận hàng
    CONSTRAINT chk_delivery_method CHECK (
        (address_id IS NOT NULL AND pickup_store_id IS NULL)
        OR (address_id IS NULL AND pickup_store_id IS NOT NULL)
        OR (address_id IS NULL AND pickup_store_id IS NULL)
    )
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    base_price NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    final_price NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- =========================
-- INVENTORY
-- =========================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INT DEFAULT 5,
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'archived')),
    deleted_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_logs (
    id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES inventory(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL
        CHECK (action IN ('import', 'export', 'adjust', 'delete')),
    quantity_before INT,
    quantity_change INT,
    quantity_after INT,
    reference_id INT,
    note TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_inventory_id ON inventory_logs(inventory_id);

-- =========================
-- BLOG / CONTACT
-- =========================
CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    content TEXT,
    thumbnail_url TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_images (
    id SERIAL PRIMARY KEY,
    blog_id INT REFERENCES blogs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_images_blog_id ON blog_images(blog_id);

CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reply TEXT,
    replied_by INT REFERENCES users(id) ON DELETE SET NULL,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PROMOTION
-- =========================
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    discount_type VARCHAR(20) NOT NULL
        CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,          -- Càng cao càng được ưu tiên áp dụng trước
    stackable BOOLEAN DEFAULT TRUE,  -- FALSE = độc quyền, không cộng dồn với promotion khác
    CONSTRAINT chk_promotion_dates CHECK (end_date > start_date)
);

CREATE TABLE product_promotions (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    promotion_id INT REFERENCES promotions(id) ON DELETE CASCADE,
    UNIQUE (product_id, promotion_id)
);

CREATE INDEX idx_promotions_active_dates ON promotions(is_active, start_date, end_date);

-- =========================
-- REVIEW & FAVORITE
-- =========================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Mỗi user chỉ review 1 lần mỗi sản phẩm
    UNIQUE (user_id, product_id)
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_favorites_user_id ON favorites(user_id) WHERE is_deleted = FALSE;