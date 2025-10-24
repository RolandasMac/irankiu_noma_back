import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
// import { sendOrderEvent } from "../events/sendOrderEvent.js";
// import { publishOrderCreated } from "../rabbit/publisher.js";
import { getClientById } from "../rabbit/getClientById.js";
import { getToolById } from "../rabbit/getToolById.js";
import { getDiscount } from "../rabbit/getDiscountByToolId.js";
import { generateDocs } from "../rabbit/generateDocs.js";

// test docNumGenerator
import { getNextNumber } from "../utils/numberGenerator.js";
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
  console.log("Order1", req.body);
  const {
    client_id,
    clientName,
    tool_id,
    toolName,
    date,
    date_until,
    days,
    discount,
    pay_sum,
    depozit,
    payment_method,
    // pay_sum_words,
    lang,
  } = req.body;

  console.log(
    "req.body",
    client_id,
    clientName,
    tool_id,
    toolName,
    date,
    date_until,
    days,
    discount,
    pay_sum,
    depozit,
    payment_method,
    // pay_sum_words,
    lang
  );
  const order = new Order({
    client_id,
    clientName,
    tool_id,
    toolName,
    date,
    date_until,
    days,
    discount,
    pay_sum,
    depozit,
    payment_method,
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
  tool.rentPrice = parseFloat(
    (tool.rentPrice * (1 - discount / 100)).toFixed(2)
  ).toFixed(2);

  // const payment = days * tool.rentPrice;
  // console.log("payment", payment);

  const orderFullData = {
    id: createdOrder._id,
    client,
    tool,
    days,
    discount,
    // payment,
    date,
    date_until,
    pay_sum,
    payment_method,
    // pay_sum_words,
    lang,
  };

  // ------------------------------------------
  // Generuoja doc numerius
  // ------------------------------------------
  const docNr = {
    contractNr: await getNextNumber("contract"),
    invoiceNr: await getNextNumber("invoice"),
    receiptNr: await getNextNumber("receipt"),
  };
  console.log("docNr", docNr);
  // ------------------------------------------
  orderFullData.docNr = docNr;
  console.log("orderFullData", orderFullData);

  // Duodama komanda generuoti dokumentus
  console.log("Duodama komanda generuoti dokumentus");
  const docs = await generateDocs(orderFullData);
  console.log("docs", docs);

  const updatedOrder = await Order.findByIdAndUpdate(createdOrder._id, {
    docs_urls: docs,
    docNr,
  });
  // await sendOrderEvent(order); // <--- čia išsiunčiam eventą
  // await publishOrderCreated(order);
  res
    .status(201)
    .json({ success: true, message: "Order created", updatedOrder });
}

export async function updateOrder(req, res) {
  const { id } = req.params;
  const updates = req.body;
  console.log("Updates", id, updates);

  const order = await Order.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  // console.log("order'is", order);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  // *******************************************************
  // gauname kliento duomenis iš client servico
  console.log("Prieš klientą", updates.client_id);
  const client = await getClientById(updates.client_id);
  console.log("client", client);
  // gauname tools duomenis iš tools serviso
  console.log("Prieš tools", updates.tool_id);
  const tool = await getToolById(updates.tool_id);
  console.log("tool", tool);
  // gauname discounts duomenis iš discounts serviso
  console.log("Prieš discounts", updates.tool_id);
  const discounts = await getDiscount(updates.tool_id, updates.days);
  console.log("discounts", discounts);
  // Paskaičiuojame kainą

  tool.rentPrice = parseFloat(
    (tool.rentPrice * (1 - updates.discount / 100)).toFixed(2)
  ).toFixed(2);
  const payment = updates.days * tool.rentPrice;
  console.log("payment", payment);

  const orderFullData = {
    id: order._id,
    client,
    tool,
    days: updates.days,
    discount: updates.discount,
    // payment,
    date: updates.date,
    date_until: updates.date_until,
    pay_sum: payment,
    payment_method: updates.payment_method,
    // pay_sum_words: updates.pay_sum_words,
    docNr: order.docNr,
  };
  // console.log("orderFullData", orderFullData);

  // Duodama komanda generuoti dokumentus
  console.log("Duodama komanda generuoti dokumentus");
  const docs = await generateDocs(orderFullData);
  console.log("docs", docs);
  const updatedOrder = await Order.findByIdAndUpdate(order._id, {
    docs_urls: docs,
  });

  // *******************************************************

  res.json({ success: true, order });
}

export async function deleteOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findByIdAndDelete(id);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  // ------------------------------------------------------
  //  Ištrinto dokumento numerį įdedame atgal naudojimui
  // ------------------------------------------------------
  const { contractNr, invoiceNr, receiptNr } = order.docNr;
  let message = "";
  if ((contractNr, invoiceNr, receiptNr)) {
    await returnNumberToCounter("receipt", receiptNr);
    message = "Order deleted and numbers returned to counters";
  } else {
    message = "Order deleted";
  }

  res.json({ success: true, message });
}
export async function test(req, res) {
  const { type, num } = req.body;
  let number = 25;

  // Įdeda numerį į eilę sekančiam suteikimui
  if (num) {
    const year = new Date().getFullYear();
    await Counter.updateOne(
      { id: `${type}_${year}` },
      { $push: { availableNumbers: { $each: [num], $sort: 1 } } }
    );
  }

  // Duoda sekantį prieinamą numerį
  number = await getNextNumber(type);

  console.log("number", number);

  res.json({
    success: true,
    message: "OrdersService test endpoint work well!",
    number,
  });
}

/**
 * Ištrina numerį iš DB ir grąžina jo skaičių į Counter.availableNumbers
 * Pvz. "CON-2025-004" -> 4
 * @param {string} type - dokumento tipas ("contract", "invoice", "receipt" ir t.t.)
 * @param {string} docNumber - pilnas numeris, pvz. "CON-2025-004"
 */
export async function returnNumberToCounter(type, docNumber) {
  if (!docNumber || typeof docNumber !== "string") return;

  // 1️⃣ Ištraukiame skaičiaus dalį iš pabaigos
  // Paieško bet kokių 1 ar daugiau skaitmenų gale
  const match = docNumber.match(/(\d+)$/);
  if (!match) return;

  // 2️⃣ Paverčiam į skaičių (pašalinam nulius priekyje)
  const num = parseInt(match[1], 10);
  if (isNaN(num)) return;

  // 3️⃣ Grąžinam jį į Counter.availableNumbers
  const year = new Date().getFullYear();

  await Counter.updateOne(
    { id: `${type}_${year}` },
    { $push: { availableNumbers: { $each: [num], $sort: 1 } } }
  );

  console.log(`✅ Numeris ${num} (${docNumber}) grąžintas į ${type}_${year}`);
}
