const { query } = require('../db');

async function calculateItem(product, extras = []) {
  const extrasTotal = extras.reduce((sum, ex) => sum + Number(ex.price || 0), 0);
  const final = (Number(product.price) + extrasTotal);
  return { extrasTotal, final };
}

async function createOrder(req, res) {
  const { items = [], type = 'PICKUP', note, payment_method, table_id, cashier_id } = req.body;
  if (!items.length) return res.status(400).json({ message: 'Items required' });
  const productIds = items.map((i) => i.product_id);
  const productsRes = await query('SELECT * FROM products WHERE id = ANY($1)', [productIds]);
  const extrasRes = await query('SELECT * FROM product_extras WHERE product_id = ANY($1)', [productIds]);
  const extrasByProduct = extrasRes.rows.reduce((acc, ex) => {
    acc[ex.product_id] = acc[ex.product_id] || [];
    acc[ex.product_id].push(ex);
    return acc;
  }, {});

  let subtotal = 0;
  const orderItemsPayload = [];
  for (const item of items) {
    const product = productsRes.rows.find((p) => p.id === item.product_id);
    if (!product) return res.status(400).json({ message: `Invalid product ${item.product_id}` });
    const availableExtras = extrasByProduct[product.id] || [];
    const selectedExtras = (item.extras || []).map((id) => availableExtras.find((e) => e.id === id)).filter(Boolean);
    const { final } = await calculateItem(product, selectedExtras);
    const line = final * item.quantity;
    subtotal += line;
    orderItemsPayload.push({
      product,
      selectedExtras,
      quantity: item.quantity,
      item_notes: item.item_notes,
      final,
    });
  }
  const vat = subtotal * 0.15;
  const total = subtotal + vat;
  const userId = req.user?.id || null;
  const orderRes = await query(
    'INSERT INTO orders (user_id, cashier_id, table_id, status, type, payment_method, subtotal, vat, total, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
    [userId, cashier_id || null, table_id || null, 'PENDING', type, payment_method || null, subtotal, vat, total, note || null]
  );
  const order = orderRes.rows[0];
  for (const item of orderItemsPayload) {
    await query(
      'INSERT INTO order_items (order_id, product_id, product_name_snapshot, quantity, base_price_snapshot, extras_snapshot, final_price, item_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        order.id,
        item.product.id,
        item.product.name_en,
        item.quantity,
        item.product.price,
        JSON.stringify(item.selectedExtras),
        item.final,
        item.item_notes || null,
      ]
    );
  }
  return res.status(201).json({ orderId: order.id, total: order.total });
}

async function myHistory(req, res) {
  const orders = await query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
  return res.json(orders.rows);
}

async function getOrder(req, res) {
  const { id } = req.params;
  const order = await query('SELECT * FROM orders WHERE id=$1', [id]);
  if (!order.rows.length) return res.status(404).json({ message: 'Order not found' });
  if (req.user.role === 'customer' && order.rows[0].user_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const items = await query('SELECT * FROM order_items WHERE order_id=$1', [id]);
  return res.json({ ...order.rows[0], items: items.rows });
}

async function activeOrders(req, res) {
  const orders = await query("SELECT * FROM orders WHERE status NOT IN ('COMPLETED','REJECTED') ORDER BY created_at DESC");
  return res.json(orders.rows);
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const timestamps = {
    ACCEPTED: 'accepted_at',
    PREPARING: 'prepared_at',
    READY: 'ready_at',
    COMPLETED: 'completed_at',
  };
  const timestampColumn = timestamps[status];
  const fields = ['status=$1'];
  const values = [status];
  if (timestampColumn) {
    fields.push(`${timestampColumn}=NOW()`);
  }
  fields.push('estimated_ready_at = COALESCE(estimated_ready_at, NOW() + INTERVAL \'10 minutes\')');
  values.push(id);
  const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id=$${values.length} RETURNING *`;
  const result = await query(sql, values);
  if (!result.rows.length) return res.status(404).json({ message: 'Order not found' });
  return res.json(result.rows[0]);
}

async function rateOrder(req, res) {
  const { id } = req.params;
  const { rating, rating_comment } = req.body;
  const order = await query('SELECT user_id, status FROM orders WHERE id=$1', [id]);
  if (!order.rows.length) return res.status(404).json({ message: 'Order not found' });
  if (order.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (order.rows[0].status !== 'COMPLETED') return res.status(400).json({ message: 'Order not completed' });
  const result = await query('UPDATE orders SET rating=$1, rating_comment=$2 WHERE id=$3 RETURNING *', [rating, rating_comment, id]);
  return res.json(result.rows[0]);
}

module.exports = { createOrder, myHistory, getOrder, activeOrders, updateStatus, rateOrder };
