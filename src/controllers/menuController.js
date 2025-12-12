const { query } = require('../db');

async function listCategories(req, res) {
  const result = await query('SELECT * FROM categories WHERE is_active=true ORDER BY id');
  return res.json(result.rows);
}

async function listProducts(req, res) {
  const products = await query('SELECT * FROM products WHERE is_available=true');
  const ids = products.rows.map((p) => p.id);
  const extras = ids.length
    ? await query('SELECT * FROM product_extras WHERE product_id = ANY($1)', [ids])
    : { rows: [] };
  const extrasByProduct = extras.rows.reduce((acc, ex) => {
    acc[ex.product_id] = acc[ex.product_id] || [];
    acc[ex.product_id].push(ex);
    return acc;
  }, {});
  const data = products.rows.map((p) => ({ ...p, extras: extrasByProduct[p.id] || [] }));
  return res.json(data);
}

async function getProduct(req, res) {
  const { id } = req.params;
  const product = await query('SELECT * FROM products WHERE id=$1', [id]);
  if (!product.rows.length) return res.status(404).json({ message: 'Product not found' });
  const extras = await query('SELECT * FROM product_extras WHERE product_id=$1', [id]);
  return res.json({ ...product.rows[0], extras: extras.rows });
}

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
    extras = [],
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO products (
        category_id, name_en, name_ar, description_en, description_ar,
        price, image_url, is_available, nutrition_info, allergens
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        category_id || null,
        name_en,
        name_ar,
        description_en,
        description_ar,
        price,
        image_url,
        is_available ?? true,
        JSON.stringify(nutrition_info || {}),   // ← مهم
        JSON.stringify(allergens || []),        // ← مهم
      ]
    );

    const product = result.rows[0];

    for (const extra of extras) {
      await query(
        'INSERT INTO product_extras (product_id, name_en, name_ar, price) VALUES ($1,$2,$3,$4)',
        [product.id, extra.name_en, extra.name_ar, extra.price || 0]
      );
    }

    const extrasRows = await query('SELECT * FROM product_extras WHERE product_id=$1', [product.id]);

    return res.status(201).json({ ...product, extras: extrasRows.rows });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR →", err);
    return res.status(400).json({ message: err.message || "Failed to create product" });
  }
}


async function updateProduct(req, res) {
  const { id } = req.params;
  const { price, image_url, is_available, name_en, name_ar, description_en, description_ar } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;
  const addField = (name, value) => {
    fields.push(`${name}=$${idx++}`);
    values.push(value);
  };
  if (price !== undefined) addField('price', price);
  if (image_url !== undefined) addField('image_url', image_url);
  if (is_available !== undefined) addField('is_available', is_available);
  if (name_en !== undefined) addField('name_en', name_en);
  if (name_ar !== undefined) addField('name_ar', name_ar);
  if (description_en !== undefined) addField('description_en', description_en);
  if (description_ar !== undefined) addField('description_ar', description_ar);
  if (!fields.length) return res.json({ message: 'Nothing to update' });
  values.push(id);
  const sql = `UPDATE products SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`;
  const result = await query(sql, values);
  if (!result.rows.length) return res.status(404).json({ message: 'Product not found' });
  return res.json(result.rows[0]);
}

async function deleteProduct(req, res) {
  const { id } = req.params;
  const result = await query('UPDATE products SET is_available=false WHERE id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).json({ message: 'Product not found' });
  return res.json({ message: 'Product disabled' });
}

module.exports = { listCategories, listProducts, getProduct, createProduct, updateProduct, deleteProduct };
