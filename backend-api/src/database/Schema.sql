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
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    full_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),

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
    user_id INTEGER REFERENCES users(id),

    bank_name VARCHAR(100),
    card_holder_name VARCHAR(100),
    card_last4 VARCHAR(4),

    is_default BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    slug VARCHAR(100),

    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,

    name VARCHAR(200),
    slug VARCHAR(200),
    description TEXT,

    price NUMERIC(12,2),
    stock INTEGER DEFAULT 0,

    product_type VARCHAR(20),
    -- sim | device | internet | tv | accessory | bundle

    category_id INTEGER REFERENCES categories(id),

    is_available BOOLEAN DEFAULT TRUE,

    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_details (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,

    detail_name VARCHAR(100),
    detail_value TEXT
);

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,

    image_url TEXT
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES products(id),

    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,

    status VARCHAR(20) DEFAULT 'active',
    deleted_at TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_logs (
    id SERIAL PRIMARY KEY,

    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),

    action VARCHAR(20) NOT NULL,
    -- import | export | order | adjust | delete | restore

    quantity_before INTEGER,
    quantity_change INTEGER,
    quantity_after INTEGER,

    reference_id INTEGER,
    -- order_id / admin_action_id / null

    note TEXT,

    created_by INTEGER REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100),
    province VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),

    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,

    cart_id INTEGER REFERENCES carts(id),
    product_id INTEGER REFERENCES products(id),

    quantity INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(cart_id, product_id)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,

    order_code VARCHAR(50) UNIQUE,

    user_id INTEGER REFERENCES users(id),

    address_id INTEGER REFERENCES user_addresses(id),
    pickup_store_id INTEGER REFERENCES stores(id),

    total_amount NUMERIC(12,2),

    payment_method VARCHAR(30),
    status VARCHAR(30) DEFAULT 'pending',

    note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,

    order_id INTEGER REFERENCES orders(id),

    product_id INTEGER REFERENCES products(id),

    product_name VARCHAR(200),
    product_price NUMERIC(12,2),

    quantity INTEGER,
    price NUMERIC(12,2),

    discount_amount NUMERIC(12,2) DEFAULT 0
);

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

    product_id INTEGER REFERENCES products(id),
    promotion_id INTEGER REFERENCES promotions(id)
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),

    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),

    rating INTEGER,
    comment TEXT,

    is_deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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