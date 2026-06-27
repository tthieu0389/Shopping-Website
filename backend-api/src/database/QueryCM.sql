-- =========================
-- USERS & PROFILE
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password TEXT,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
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
    user_id INT REFERENCES users(id),
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
    name VARCHAR(100),
    slug VARCHAR(100),
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    stock INT DEFAULT 0, 
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
    image_url TEXT,
    is_thumbnail BOOLEAN DEFAULT FALSE
);

CREATE TABLE product_details (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    detail_name VARCHAR(100),
    detail_value TEXT
);

CREATE INDEX idx_products_category_type ON products(category_id, product_type) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_brand_model ON products(brand, model) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_price ON products(price) WHERE is_deleted = FALSE;

-- GIN Index: Giúp database quét xuyên thấu vào sâu bên trong nội dung JSONB attributes cực nhanh
CREATE INDEX idx_products_attributes ON products USING gin (attributes);

-- =========================
-- CART
-- =========================
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id),
    product_id INT REFERENCES products(id),
    quantity INT DEFAULT 1,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id)
);

-- =========================
-- ORDER
-- =========================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE,
    user_id INT REFERENCES users(id),
    address_id INT REFERENCES user_addresses(id),
    pickup_store_id INT REFERENCES stores(id),
    receiver_name VARCHAR(100),
    receiver_phone VARCHAR(20),
    shipping_address TEXT,
    shipping_fee NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2),
    payment_method VARCHAR(30),
    status VARCHAR(30) DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    product_name VARCHAR(200),
    quantity INT NOT NULL,
    base_price NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    final_price NUMERIC(12,2) NOT NULL
);

-- =========================
-- STORE
-- =========================
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    province VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE
);

ALTER TABLE orders
ADD CONSTRAINT fk_orders_store
FOREIGN KEY (pickup_store_id) REFERENCES stores(id);

-- =========================
-- INVENTORY
-- =========================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT UNIQUE REFERENCES products(id),
    quantity INT DEFAULT 0,
    min_quantity INT DEFAULT 5,
    status VARCHAR(20) DEFAULT 'active',
    deleted_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_logs (
    id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES inventory(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    action VARCHAR(20) NOT NULL,
    quantity_before INT,
    quantity_change INT,
    quantity_after INT,
    reference_id INT,
    note TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BLOG / CONTACT
-- =========================
CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    slug VARCHAR(200),
    content TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PROMOTION
-- =========================
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    discount_type VARCHAR(20),
    discount_value NUMERIC(10,2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE product_promotions (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    promotion_id INT REFERENCES promotions(id),
    UNIQUE (product_id, promotion_id)
);

-- =========================
-- REVIEW & FAVORITE
-- =========================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    product_id INT REFERENCES products(id),
    rating INT,
    comment TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    product_id INT REFERENCES products(id),
    is_deleted BOOLEAN DEFAULT FALSE
);