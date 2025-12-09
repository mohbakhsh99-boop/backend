const { query } = require('../db');

async function dashboard(req, res) {
  const today = await query("SELECT COALESCE(SUM(total),0) as revenue FROM orders WHERE status='COMPLETED' AND DATE(created_at)=CURRENT_DATE");
  const active = await query("SELECT COUNT(*) FROM orders WHERE status NOT IN ('COMPLETED','REJECTED')");
  const lowStock = []; // placeholder for inventory alerts
  return res.json({ today_revenue: today.rows[0].revenue, active_orders: Number(active.rows[0].count), low_stock: lowStock });
}

async function revenue(req, res) {
  const { startDate, endDate, group_by = 'day' } = req.query;
  const group = group_by === 'month' ? 'YYYY-MM' : group_by === 'year' ? 'YYYY' : 'YYYY-MM-DD';
  const sql = `SELECT TO_CHAR(created_at, '${group}') as bucket, SUM(total) as revenue FROM orders WHERE status='COMPLETED' AND created_at BETWEEN $1 AND $2 GROUP BY bucket ORDER BY bucket`;
  const result = await query(sql, [startDate, endDate]);
  return res.json(result.rows);
}

async function products(req, res) {
  const { startDate, endDate } = req.query;
  const sql = `SELECT oi.product_id, oi.product_name_snapshot, SUM(oi.quantity) as quantity, SUM(oi.final_price * oi.quantity) as revenue
               FROM order_items oi JOIN orders o ON oi.order_id=o.id
               WHERE o.status='COMPLETED' AND o.created_at BETWEEN $1 AND $2
               GROUP BY oi.product_id, oi.product_name_snapshot
               ORDER BY quantity DESC`;
  const result = await query(sql, [startDate, endDate]);
  return res.json(result.rows);
}

async function staff(req, res) {
  const { startDate, endDate } = req.query;
  const sql = `SELECT cashier_id, COUNT(*) as orders_count, SUM(total) as revenue
               FROM orders WHERE status='COMPLETED' AND cashier_id IS NOT NULL AND created_at BETWEEN $1 AND $2
               GROUP BY cashier_id`;
  const result = await query(sql, [startDate, endDate]);
  return res.json(result.rows);
}

module.exports = { dashboard, revenue, products, staff };
