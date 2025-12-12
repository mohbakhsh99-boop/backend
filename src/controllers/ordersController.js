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

/* =========================
   CREATE ORDER (NO AUTH)
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

    const productIds = items.map(i =>
      toInt(i.productId || i.product_id)
    ).filter(Boolean);

    if (!productIds.length) {
      return res.status(400).json({ message: 'Invalid products' });
    }

    const productsRes = await query(
      'SELECT * FROM products WHERE id = ANY($1)',
      [productIds]
    );

    const extrasRes = await query(
      'SELECT * FROM product_extras WHERE product_id = ANY($1)',
      [productIds]
    );

    const extrasByProduct = extrasRes.rows.reduce((acc, ex) => {
      acc[ex.product_id] = acc[ex.product_id] || [];
      acc[ex.product_id].push(ex);
      return acc;
    }, {});

    let subtotal = 0;
    const orderItemsPayload = [];

    for (const item of items) {
      const productId = toInt(item.productId || item.product_id);
      const quantity = toInt(item.qty || item.quantity || 1);

      if (!productId || !quantity) {
        return res.status(400).json({ message: 'Invalid item data' });
      }

      const product = productsRes.rows.find(p => p.id === productId);
      if (!product) {
        return res.status(400).json({ message: `Invalid product ${productId}` });
      }

      const availableExtras = extrasByProduct[product.id] || [];
      const selectedExtras = (item.extras || [])
        .map(id => availableExtras.find(e => e.id === toInt(id)))
        .filter(Boolean);

      const { final } = await calculateItem(product, selectedExtras);
      const lineTotal = final * quantity;
      subtotal += lineTotal;

      orderItemsPayload.push({
        product,
        selectedExtras,
        quantity,
        item_notes: item.notes || item.item_notes || null,
        final,
      });
    }

    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    const orderRes = await query(
      `INSERT INTO orders
        (user_id, cashier_id, table_id, status, type, payment_method, subtotal, vat, total, note)
       VALUES ($1,$2,$3,'PENDING',$4,$5,$6,$7,$8,$9)
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
          item.product.price,
          JSON.stringify(item.selectedExtras),
          item.final,
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

  const orders = await query(
    'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  return res.json(orders.rows);
}

async function getOrder(req, res) {
  try {
    const orderId = toInt(req.params.id);
    if (!orderId) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await query(
      'SELECT * FROM orders WHERE id=$1',
      [orderId]
    );

    if (!order.rows.length) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const items = await query(
      'SELECT * FROM order_items WHERE order_id=$1',
      [orderId]
    );

    return res.json({ ...order.rows[0], items: items.rows });

  } catch (err) {
    console.error('getOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function activeOrders(req, res) {
  const orders = await query(
    `SELECT * FROM orders
     WHERE status NOT IN ('COMPLETED','REJECTED')
     ORDER BY created_at DESC`
  );
  return res.json(orders.rows);
}

async function updateStatus(req, res) {
  const orderId = toInt(req.params.id);
  const { status } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Invalid order id' });
  }

  const timestamps = {
    ACCEPTED: 'accepted_at',
    PREPARING: 'prepared_at',
    READY: 'ready_at',
    COMPLETED: 'completed_at',
  };

  const fields = ['status=$1'];
  const values = [status];

  if (timestamps[status]) {
    fields.push(`${timestamps[status]}=NOW()`);
  }

  values.push(orderId);

  const sql = `
    UPDATE orders
    SET ${fields.join(', ')}
    WHERE id=$${values.length}
    RETURNING *
  `;

  const result = await query(sql, values);
  if (!result.rows.length) {
    return res.status(404).json({ message: 'Order not found' });
  }

  return res.json(result.rows[0]);
}

async function rateOrder(req, res) {
  const orderId = toInt(req.params.id);
  const { rating, rating_comment } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Invalid order id' });
  }

  const result = await query(
    `UPDATE orders
     SET rating=$1, rating_comment=$2
     WHERE id=$3
     RETURNING *`,
    [rating, rating_comment, orderId]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: 'Order not found' });
  }

  return res.json(result.rows[0]);
}

async function listOrders(req, res) {
  const userId = toInt(req.query.user_id);

  const result = userId
    ? await query(
        'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
        [userId]
      )
    : await query(
        'SELECT * FROM orders ORDER BY created_at DESC'
      );

  return res.json(result.rows);
}

module.exports = {
  createOrder,
  myHistory,
  getOrder,
  activeOrders,
  updateStatus,
  rateOrder,
  listOrders
};
