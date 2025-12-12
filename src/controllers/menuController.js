const { query } = require('../db');

/* =========================
   Categories
========================= */

async function listCategories(req, res) {
  const result = await query(
    'SELECT * FROM categories ORDER BY id'
  );
  return res.json(result.rows);
}

async function createCategory(req, res) {
  const {
    name_en,
    name_ar,
    description,
    is_active = true
  } = req.body;

  if (!name_en) {
    return res.status(400).json({ message: 'name_en is required' });
  }

  const result = await query(
    `
    INSERT INTO categories (name_en, name_ar, description, is_active)
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
    [name_en, name_ar || null, description || null, is_active]
  );

  return res.status(201).json(result.rows[0]);
}

async function updateCategory(req, res) {
  const { id } = req.params;
  const { name_en, name_ar, description, is_active } = req.body;

  const fields = [];
  const values = [];
  let idx = 1;

  const add = (field, value) => {
    fields.push(`${field}=$${idx++}`);
    values.push(value);
  };

  if (name_en !== undefined) add('name_en', name_en);
  if (name_ar !== undefined) add('name_ar', name_ar);
  if (description !== undefined) add('description', description);
  if (is_active !== undefined) add('is_active', is_active);

  if (!fields.length) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  values.push(id);

  const result = await query(
    `
    UPDATE categories
    SET ${fields.join(', ')}
    WHERE id=$${idx}
    RETURNING *
    `,
    values
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Category not found' });
  }

  return res.json(result.rows[0]);
}

async function deleteCategory(req, res) {
  const { id } = req.params;

  const result = await query(
    'UPDATE categories SET is_active=false WHERE id=$1 RETURNING *',
    [id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Category not found' });
  }

  return res.json({ message: 'Category disabled' });
}

/* =========================
   Products
========================= */

async function listProducts(req, res) {
  const products = await query(
    'SELECT * FROM products WHERE is_available=true ORDER BY id'
  );

  const ids = products.rows.map(p => p.id);

  const extras = ids.length
    ? await query(
        'SELECT * FROM product_extras WHERE product_id = ANY($1)',
        [ids]
      )
    : { rows: [] };

  const extrasByProduct = extras.rows.reduce((acc, ex) => {
    acc[ex.product_id] = acc[ex.product_id] || [];
    acc[ex.product_id].push(ex);
    return acc;
  }, {});

  const data = products.rows.map(p => ({
    ...p,
    extras: extrasByProduct[p.id] || []
  }));

  return res.json(data);
}

async function getProduct(req, res) {
  const { id } = req.params;

  const product = await query(
    'SELECT * FROM products WHERE id=$1',
    [id]
  );

  if (!product.rows.length) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const extras = await query(
    'SELECT * FROM product_extras WHERE product_id=$1',
    [id]
  );

  return res.json({
    ...product.rows[0],
    extras: extras.rows
  });
}

/* =========================
   Create Product
========================= */

async function createProduct(req, res) {
  const {
    category_id,
    name_en,
    name_ar,
    description_en,
    description_ar,
    price,
    image_url,
    is_available,
    nutrition_info,
    allergens,
    extras = []
  } = req.body;

  try {
    const result = await query(
      `
      INSERT INTO products (
        category_id,
        name_en,
        name_ar,
        description_en,
        description_ar,
        price,
        image_url,
        is_available,
        nutrition_info,
        allergens
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        category_id || null,
        name_en,
        name_ar,
        description_en,
        description_ar,
        price,
        image_url,
        is_available ?? true,
        JSON.stringify(nutrition_info || {}),
        JSON.stringify(allergens || [])
      ]
    );

    const product = result.rows[0];

    for (const extra of extras) {
      await query(
        `
        INSERT INTO product_extras
        (product_id, name_en, name_ar, price)
        VALUES ($1,$2,$3,$4)
        `,
        [product.id, extra.name_en, extra.name_ar, extra.price || 0]
      );
    }

    const extrasRows = await query(
      'SELECT * FROM product_extras WHERE product_id=$1',
      [product.id]
    );

    return res.status(201).json({
      ...product,
      extras: extrasRows.rows
    });

  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);
    return res.status(400).json({
      message: err.message || 'Failed to create product'
    });
  }
}

/* =========================
   Update Product
========================= */

async function updateProduct(req, res) {
  const { id } = req.params;
  const {
    price,
    image_url,
    is_available,
    name_en,
    name_ar,
    description_en,
    description_ar
  } = req.body;

  const fields = [];
  const values = [];
  let idx = 1;

  const add = (field, value) => {
    fields.push(`${field}=$${idx++}`);
    values.push(value);
  };

  if (price !== undefined) add('price', price);
  if (image_url !== undefined) add('image_url', image_url);
  if (is_available !== undefined) add('is_available', is_available);
  if (name_en !== undefined) add('name_en', name_en);
  if (name_ar !== undefined) add('name_ar', name_ar);
  if (description_en !== undefined) add('description_en', description_en);
  if (description_ar !== undefined) add('description_ar', description_ar);

  if (!fields.length) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  values.push(id);

  const result = await query(
    `
    UPDATE products
    SET ${fields.join(', ')}
    WHERE id=$${idx}
    RETURNING *
    `,
    values
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json(result.rows[0]);
}

/* =========================
   Delete Product (Soft)
========================= */

async function deleteProduct(req, res) {
  const { id } = req.params;

  const result = await query(
    'UPDATE products SET is_available=false WHERE id=$1 RETURNING *',
    [id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json({ message: 'Product disabled' });
}

/* =========================
   EXPORTS
========================= */

module.exports = {
  // Categories
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Products
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
