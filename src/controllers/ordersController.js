const { query } = require('../db');

/* =========================
   Helpers
========================= */
function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

async function calculateItem(product, extras = []) {
  const extrasTotal = extras.reduce(
    (sum, ex) => sum + Number(ex.price || 0),
    0
  );
  const final = Number(product.price) + extrasTotal;
  return { extrasTotal, final };
}

// Helper: attach items to orders
async function attachItemsToOrders(orders) {
  if (!orders.length) return [];

  const orderIds = orders.map(o => o.id);

  const itemsRes = await query(
    'SELECT * FROM order_items WHERE order_id = ANY($1)',
    [orderIds]
  );

  const allItems = itemsRes.rows;

  return orders.map(order => ({
    ...order,
    items: allItems.filter(i => i.order_id === order.id),
  }));
}

/* =========================
   CREATE ORDER (FIXED)
========================= */
async function createOrder(req, res) {
  try {
    const {
      items = [],
      type = 'PICKUP',
      note,
      payment_method,
      table_id,
      cashier_id,
      user_id,
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: 'Items required' });
    }

    const productIds = items
      .map(i => toInt(i.productId || i.product_id))
      .filter(Boolean);

    if (!productIds.length) {
      return res.status(400).json({ message: 'Invalid products' });
    }

    const productsRes = await query(
      'SELECT * FROM products WHERE id = ANY($1)',
      [productIds]
    );

    const products = productsRes.rows;

    let subtotal = 0;
    const orderItemsPayload = [];

    for (const item of items) {
      const productId = toInt(item.productId || item.product_id);
      const quantity = toInt(item.qty || item.quantity || 1);

      if (!productId || !quantity) {
        return res.status(400).json({ message: 'Invalid item data' });
      }

      const product = products.find(p => p.id === productId);
      if (!product) {
        return res.status(400).json({ message: `Invalid product ${productId}` });
      }

      // ✅ FIX: extras snapshot مباشرة من الفرونت
      const extrasSnapshot = Array.isArray(item.extras_snapshot)
        ? item.extras_snapshot
        : Array.isArray(item.extras)
        ? item.extras
        : [];

      const { final } = await calculateItem(product, extrasSnapshot);
      const lineTotal = final * quantity;
      subtotal += lineTotal;

      orderItemsPayload.push({
        product,
        quantity,
        base_price_snapshot: product.price,
        extras_snapshot: extrasSnapshot,
        final_price: final,
        item_notes: item.item_notes || item.notes || null,
      });
    }

    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    const orderRes = await query(
      `INSERT INTO orders
       (user_id, cashier_id, table_id, status, type, payment_method, subtotal, vat, total, note)
       VALUES ($1,$2,$3,'PENDING_APPROVAL',$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        toInt(user_id),
        toInt(cashier_id),
        toInt(table_id),
        type,
        payment_method || null,
        subtotal,
        vat,
        total,
        note || null,
      ]
    );

    const order = orderRes.rows[0];

    for (const item of orderItemsPayload) {
      await query(
        `INSERT INTO order_items
          (order_id, product_id, product_name_snapshot, quantity,
           base_price_snapshot, extras_snapshot, final_price, item_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          order.id,
          item.product.id,
          item.product.name_en,
          item.quantity,
          item.base_price_snapshot,
          JSON.stringify(item.extras_snapshot),
          item.final_price,
          item.item_notes,
        ]
      );
    }

    return res.status(201).json({
      orderId: order.id,
      total: order.total,
    });

  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ message: 'Order failed' });
  }
}

/* =========================
   READS
========================= */
async function myHistory(req, res) {
  const userId = toInt(req.query.userId);
  if (!userId) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const ordersRes = await query(
    'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );

  const ordersWithItems = await attachItemsToOrders(ordersRes.rows);
  return res.json(ordersWithItems);
}

async function getOrder(req, res) {
  const orderId = toInt(req.params.id);
  if (!orderId) {
    return res.status(400).json({ message: 'Invalid order id' });
  }

  const orderRes = await query(
    'SELECT * FROM orders WHERE id=$1',
    [orderId]
  );

  if (!orderRes.rows.length) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const itemsRes = await query(
    'SELECT * FROM order_items WHERE order_id=$1',
    [orderId]
  );

  return res.json({ ...orderRes.rows[0], items: itemsRes.rows });
}

async function activeOrders(req, res) {
  const ordersRes = await query(
    `SELECT * FROM orders
     WHERE status NOT IN ('COMPLETED','REJECTED')
     ORDER BY created_at DESC`
  );

  const ordersWithItems = await attachItemsToOrders(ordersRes.rows);
  return res.json(ordersWithItems);
}

async function updateStatus(req, res) {
  const orderId = toInt(req.params.id);
  const { status } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Invalid order id' });
  }

  const result = await query(
    `UPDATE orders
     SET status=$1
     WHERE id=$2
     RETURNING *`,
    [status, orderId]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Order not found' });
  }

  return res.json(result.rows[0]);
}

async function rateOrder(req, res) {
  const orderId = toInt(req.params.id);
  const { rating, rating_comment } = req.body;

  const result = await query(
    `UPDATE orders
     SET rating=$1, rating_comment=$2
     WHERE id=$3
     RETURNING *`,
    [rating, rating_comment, orderId]
  );

  return res.json(result.rows[0]);
}

module.exports = {
  createOrder,
  myHistory,
  getOrder,
  activeOrders,
  updateStatus,
  rateOrder,
};
