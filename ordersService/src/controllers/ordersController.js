import Order from "../models/Order.js";
import { sendOrderEvent } from "../events/sendOrderEvent.js";
import { publishOrderCreated } from "../rabbit/publisher.js";
import { getClientById } from "../rabbit/getClientById.js";
import { getToolById } from "../rabbit/getToolById.js";
import { getDiscount } from "../rabbit/getDiscountByToolId.js";
import { generateDocs } from "../rabbit/generateDocs.js";
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
  const createdOrder = await order.save();

  // gauname kliento duomenis iš client servico
  console.log("Prieš klientą", client_id);
  const client = await getClientById(client_id);
  console.log("client", client);
  // gauname tools duomenis iš tools serviso
  console.log("Prieš tools", tool_id);
  const tool = await getToolById(tool_id);
  console.log("tool", tool);
  // gauname discounts duomenis iš discounts serviso
  console.log("Prieš discounts", tool_id);
  const discounts = await getDiscount(tool_id, days);
  console.log("discounts", discounts);
  // Paskaičiuojame kainą
  const payment = days * tool.price * (1 - discount / 100);
  console.log("payment", payment);

  const orderFullData = {
    id: createdOrder._id,
    client,
    tool,
    days,
    discount,
    payment,
  };
  console.log("orderFullData", orderFullData);

  // Duodama komanda generuoti dokumentus
  console.log("Duodama komanda generuoti dokumentus");
  const docs = await generateDocs(orderFullData);
  console.log("docs", docs);
  const updatedOrder = await Order.findByIdAndUpdate(createdOrder._id, {
    docs_urls: docs,
  });
  // await sendOrderEvent(order); // <--- čia išsiunčiam eventą
  // await publishOrderCreated(order);
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
