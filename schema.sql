-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  language VARCHAR(5) DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  prep_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name_en VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  nutrition_info JSONB,
  allergens JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product extras
CREATE TABLE IF NOT EXISTS product_extras (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name_en VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  label VARCHAR(20) UNIQUE NOT NULL,
  seats INTEGER DEFAULT 2,
  status VARCHAR(20) DEFAULT 'AVAILABLE'
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  type VARCHAR(20) DEFAULT 'PICKUP',
  payment_method VARCHAR(30),
  subtotal NUMERIC(10,2) DEFAULT 0,
  vat NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  note TEXT,
  rating INTEGER,
  rating_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  prepared_at TIMESTAMP,
  ready_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_ready_at TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  base_price_snapshot NUMERIC(10,2) NOT NULL,
  extras_snapshot JSONB,
  final_price NUMERIC(10,2) NOT NULL,
  item_notes TEXT
);
