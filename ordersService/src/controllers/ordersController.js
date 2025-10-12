import Order from "../models/Order.js";

export async function listOrders(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const client_id = req.query.client_id;
  const tool_id = req.query.tool_id;

  const filter = {};
  if (client_id) filter.client_id = client_id;
  if (tool_id) filter.tool_id = tool_id;

  const [total, items] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({ success: true, page, limit, total, items });
}

export async function getOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findById(id).lean();
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, order });
}

export async function createOrder(req, res) {
  const {
    client_id,
    tool_id,
    date,
    date_until,
    days,
    discount,
    pay_sum,
    depozit,
  } = req.body;

  console.log(
    "req.body",
    client_id,
    tool_id,
    date,
    date_until,
    days,
    discount,
    pay_sum,
    depozit
  );
  const order = new Order({
    client_id,
    tool_id,
    date,
    date_until,
    days,
    discount,
    pay_sum,
    depozit,
  });
  await order.save();
  res.status(201).json({ success: true, message: "Order created", order });
}

export async function updateOrder(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const order = await Order.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  res.json({ success: true, order });
}

export async function deleteOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findByIdAndDelete(id);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  res.json({ success: true, message: "Order deleted" });
}
