import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import { getClientById } from "../rabbit/getClientById.js";
import { getToolById } from "../rabbit/getToolById.js";
import { getDiscount } from "../rabbit/getDiscountByToolId.js";
import { generateDocs } from "../rabbit/generateDocs.js";
import { getNextNumber } from "../utils/numberGenerator.js";
export async function listOrders(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const client_id = req.query.client_id;
  const tool_id = req.query.tool_id;

  const filter = {
    $or: [],
  };
  if (client_id) {
    filter.$or.push({ client_id: { $regex: client_id, $options: "i" } });
    filter.$or.push({ clientName: { $regex: client_id, $options: "i" } });
  }

  if (tool_id) {
    filter.$or.push({ tool_id: { $regex: tool_id, $options: "i" } });
    filter.$or.push({ toolName: { $regex: tool_id, $options: "i" } });
  }

  const [total, items] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  // console.log("Rezultatas", total, items);
  res.json({ success: true, page, limit, total, items });
}

export async function getOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findById(id).lean();
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  // console.log("Order", order);
  res.json({ success: true, order });
}

export async function createOrder(req, res) {
  let {
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
    lang,
    addons_total,
    addons,
  } = req.body;
  // let parsedPaymentMethod;
  // try {
  //   parsedPaymentMethod = JSON.parse(payment_method);
  // } catch {
  //   parsedPaymentMethod = { value: payment_method, label: payment_method };
  // }
  // console.log(
  //   "req.body",
  //   client_id,
  //   clientName,
  //   tool_id,
  //   toolName,
  //   date,
  //   date_until,
  //   days,
  //   discount,
  //   pay_sum,
  //   depozit,
  //   payment_method,
  //   // pay_sum_words,
  //   lang,
  //   addons_total,
  //   addons
  // );
  // return;
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
    payment_method: payment_method.value,
    addons_total,
    addons,
  });

  const createdOrder = await order.save();
  // return;
  // gauname kliento duomenis iš client servico
  // console.log("Prieš klientą", client_id);
  const client = await getClientById(client_id);
  // console.log("client", client);
  // gauname tools duomenis iš tools serviso
  // console.log("Prieš tools", tool_id);
  const tool = await getToolById(tool_id, "get-tool");
  // console.log("tool", tool);
  // gauname discounts duomenis iš discounts serviso
  // console.log("Prieš discounts", tool_id);
  const discounts = await getDiscount(tool_id, days);
  // console.log("discounts", discounts);
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
    days: Number(days),
    discount: Number(discount),
    // payment,
    date,
    date_until,
    pay_sum: Number(pay_sum),
    payment_method,
    // pay_sum_words,
    lang,
    depozit: Number(depozit),
    addons_total: Number(addons_total) || 0,
    addons,
  };

  // ------------------------------------------
  // Generuoja doc numerius
  // ------------------------------------------
  const docNr = {
    contractNr: await getNextNumber("contract"),
    invoiceNr: await getNextNumber("invoice"),
    receiptNr:
      payment_method.value !== "debit" ? await getNextNumber("receipt") : "",
  };
  // console.log("docNr", docNr);
  // ------------------------------------------
  orderFullData.docNr = docNr;
  // console.log("orderFullData", orderFullData);

  // formuojame tempaltes
  let listTemplates = {};
  // if (parsedPaymentMethod.value === "debit") {
  //   listTemplates = {
  //     contract: "Nomas ligums.docx",
  //     invoice: "Rekins.docx",
  //   };
  // } else {
  //   listTemplates = {
  //     contract: "Nomas ligums.docx",
  //     receipt: "Kvits.docx",
  //     invoice: "Rekins.docx",
  //   };
  // }

  if (payment_method.value === "debit") {
    listTemplates = {
      contract: tool.group.templates.contract,
      invoice: tool.group.templates.invoice,
    };
  } else {
    listTemplates = {
      contract: tool.group.templates.contract,
      receipt: tool.group.templates.receipt,
      invoice: tool.group.templates.invoice,
    };
  }

  // Duodama komanda generuoti dokumentus
  // console.log("Duodama komanda generuoti dokumentus");
  const docs = await generateDocs(orderFullData, listTemplates);
  // console.log("docs", docs);

  const updatedOrder = await Order.findByIdAndUpdate(createdOrder._id, {
    docs_urls: docs,
    docNr,
  });
  const toolUpdated = await getToolById(tool_id, "update-tool", {
    rented: true,
    rented_until: updatedOrder.date_until,
  });
  // await sendOrderEvent(order); // <--- čia išsiunčiam eventą
  // await publishOrderCreated(order);
  res
    .status(201)
    .json({ success: true, message: "Order created", updatedOrder });
}

export async function updateOrder(req, res) {
  const { id } = req.params;
  let {
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
    lang,
    docNr,
    paid,
    returned,
    addons_total,
    addons,
  } = req.body;

  const updates = {
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
    payment_method: payment_method.value,
    lang,
    paid,
    returned,
    addons_total,
    addons,
  };

  const oldOrder = await Order.findById(id).lean();
  if (tool_id !== oldOrder.tool_id) {
    const updatedTool = await getToolById(oldOrder.tool_id, "update-tool", {
      rented: false,
      rented_until: null,
    });
  }

  const order = await Order.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  // *******************************************************
  const client = await getClientById(updates.client_id);
  const tool = await getToolById(updates.tool_id, "get-tool");
  // const discounts = await getDiscount(updates.tool_id, updates.days);

  tool.rentPrice = parseFloat(
    (tool.rentPrice * (1 - updates.discount / 100)).toFixed(2)
  ).toFixed(2);
  const payment = updates.days * tool.rentPrice;

  const orderFullData = {
    id: order._id,
    client,
    tool,
    days: updates.days,
    discount: updates.discount,
    date: updates.date,
    date_until: updates.date_until,
    pay_sum: payment,
    payment_method,
    lang,
    docNr: order.docNr,
    depozit,
    addons_total,
    addons,
  };
  console.log("Iki Pries numeriu grazinima", order.docNr, order.docNr.length);
  if (order.docNr && Object.keys(order.docNr).length > 0) {
    for (const [key, value] of Object.entries(order.docNr)) {
      const name = key.replace("Nr", "");
      console.log("Pries numeriu grazinima");
      await returnNumberToCounter(name, String(value));
    }
  }

  // ------------------------------------------
  // Generuoja doc numerius
  // ------------------------------------------
  const newDocNr = {
    contractNr: await getNextNumber("contract"),
    invoiceNr: await getNextNumber("invoice"),
    receiptNr:
      payment_method.value !== "debit" ? await getNextNumber("receipt") : "",
  };
  // ------------------------------------------
  orderFullData.docNr = newDocNr;

  // formuojame tempaltes
  let listTemplates = {};

  // Duodama komanda generuoti dokumentus
  if (payment_method.value === "debit") {
    listTemplates = {
      contract: tool.group.templates.contract,
      invoice: tool.group.templates.invoice,
    };
  } else {
    listTemplates = {
      contract: tool.group.templates.contract,
      receipt: tool.group.templates.receipt,
      invoice: tool.group.templates.invoice,
    };
  }

  const docs = await generateDocs(orderFullData, listTemplates);
  const updatedOrder = await Order.findByIdAndUpdate(order._id, {
    docs_urls: docs,
    docNr: newDocNr,
  });

  const toolUpdates = await getToolById(tool_id, "update-tool", {
    rented: true,
    rented_until: date_until,
  });

  // *******************************************************

  res.json({ success: true, order: updatedOrder });
}
export async function cancelOrder(req, res) {
  const { id } = req.params;

  let { tool_id, date_until, paid, returned } = req.body;

  const oldOrder = await Order.findById(id).lean();
  if (String(oldOrder.returned) !== String(returned) && returned === "true") {
    const order = await Order.findByIdAndUpdate(
      id,
      { returned: true },
      {
        new: true,
        runValidators: true,
      }
    );
    const tool = await getToolById(tool_id, "update-tool", {
      rented: false,
      rented_until: null,
    });
    if (!order || !tool)
      return res
        .status(404)
        .json({ success: false, message: "Order or tool not found" });
    return res
      .status(201)
      .json({ success: true, message: "Order updated", order });
  } else if (
    String(oldOrder.returned) !== String(returned) &&
    returned === "false"
  ) {
    const order1 = await Order.findByIdAndUpdate(
      id,
      { returned: false },
      {
        new: true,
        runValidators: true,
      }
    );
    const tool = await getToolById(tool_id, "update-tool", {
      rented: true,
      rented_until: date_until,
    });
    if (!order1 || !tool)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    return res
      .status(201)
      .json({ success: true, message: "Order updated", order1 });
  } else if (String(oldOrder.paid) !== String(paid)) {
    const order1 = await Order.findByIdAndUpdate(
      id,
      { paid: paid === "true" ? true : false },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!order1)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    return res
      .status(201)
      .json({ success: true, message: "Order updated", order1 });
  }
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
  if (receiptNr) {
    await returnNumberToCounter("receipt", receiptNr);
    await returnNumberToCounter("invoice", invoiceNr);
    await returnNumberToCounter("contract", contractNr);
    message = "Order deleted and numbers returned to counters";
  } else {
    await returnNumberToCounter("invoice", invoiceNr);
    await returnNumberToCounter("contract", contractNr);
    message = "Order deleted";
  }

  // ------------------------------------------------------
  //  Pakeičia tool status į rented false
  // ------------------------------------------------------
  if (order.returned !== "true") {
    const tool = await getToolById(order.tool_id, "update-tool", {
      rented: false,
      rented_until: null,
    });
    if (!tool)
      return res
        .status(404)
        .json({ success: false, message: "Tool not found" });
    return res
      .status(201)
      .json({ success: true, message: "Order updated", order });
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
  res.json({
    success: true,
    message: "OrdersService test endpoint work well!",
    number,
  });
}
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
  console.log("Pries numeriu grazinima i DB");
  await Counter.updateOne(
    { id: `${type}_${year}` },
    { $push: { availableNumbers: { $each: [num], $sort: 1 } } }
  );
}
