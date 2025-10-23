// // rabbit/consumer.js
// import { getChannel } from "./connection.js";
// import { generateFromTemplate } from "../services/docService.js";
// import { convertDocxToPdfWithLibre } from "../utils/libreConvert.js";

// import paths from "../../../config/paths.js";
// const { generatedDir } = paths;
// import fs from "fs";
// import path from "path";

// export async function startOrderConsumer() {
//   const channel = getChannel();

//   const q = await channel.assertQueue("", { exclusive: true });
//   await channel.bindQueue(q.queue, "orders", "");

//   console.log("📨 Docs-service listening for ORDER_CREATED events...");

//   channel.consume(
//     q.queue,
//     async (msg) => {
//       if (!msg) return;
//       try {
//         const order = JSON.parse(msg.content.toString());
//         console.log("📦 Received ORDER_CREATED:", order);

//         // --- Example: Generate a document ---
//         const templateName = "1760029140328-nomas ligums1.docx"; // galima padaryti dinaminį

//         const data = {
//           date: "2025-10-09",
//           nomnieks_vards: "Jonas Jonaitis",
//           nomnieks_adrese: "Vilniaus g. 1",
//           email: "rolandas.macius@gmail.com",
//           phone: "+37067606999",
//           nomas_objekts: "Grąžtas",
//           nomas_summa: "1200 EUR",
//           nomas_termins: "12 mėn.",
//           sutarties_data: "2025-10-09",
//         };

//         // const outPath = await generateFromTemplate(templateName, {
//         //   klientas: order.client_name,
//         //   irankis: order.tool_name,
//         //   dienos: order.days,
//         //   kaina: order.total_price,
//         //   data_nuo: order.date_from,
//         //   data_iki: order.date_until,
//         // });
//         const outPath = await generateFromTemplate(templateName, data);
//         console.log("outPath", outPath)
//         // const pdfPath = await convertDocxToPdfWithLibre(outPath, generatedDir);

//         // console.log(`✅ Dokumentas sugeneruotas: ${pdfPath}`);

//         // optional: nusiųsti atgal į orders-service failo URL
//         // await fetch("http://orders-service:4004/orders/document", {
//         //   method: "POST",
//         //   headers: { "Content-Type": "application/json" },
//         //   body: JSON.stringify({ orderId: order._id, file: pdfPath }),
//         // });
//       } catch (err) {
//         console.error("❌ Klaida apdorojant ORDER_CREATED:", err);
//       }
//     },
//     { noAck: true }
//   );
// }
// -*-----------------------------------------------------------------------------------------------
// import amqp from "amqplib";
// import { generateFromTemplate } from "../services/docService.js";
// import path from "path";

// const RABBIT_URL = "amqp://localhost";
// const MAIN_EXCHANGE = "order_events";
// const RETRY_EXCHANGE = "order_retry";
// const DLX_EXCHANGE = "order_dead_letter";

// export async function startOrderConsumer() {
//   const conn = await amqp.connect(RABBIT_URL);
//   const channel = await conn.createChannel();

//   // 📦 EXCHANGES
//   await channel.assertExchange(MAIN_EXCHANGE, "fanout", { durable: true });
//   await channel.assertExchange(RETRY_EXCHANGE, "fanout", { durable: true });
//   await channel.assertExchange(DLX_EXCHANGE, "fanout", { durable: true });

//   // 📥 PAGRINDINĖ EILĖ
//   await channel.assertQueue("docs_order_created", {
//     durable: true,
//     deadLetterExchange: RETRY_EXCHANGE, // kai klaida → siunčiam į retry
//   });

//   // 🔁 RETRY EILĖ (10s vėlavimas)
//   await channel.assertQueue("docs_order_retry", {
//     durable: true,
//     deadLetterExchange: MAIN_EXCHANGE, // kai baigiasi TTL → grįžta į main
//     messageTtl: 10_000, // 10 sekundžių laukimas
//   });

//   // 💀 DEAD LETTER EILĖ
//   await channel.assertQueue("docs_order_dead", { durable: true });

//   // Sujungiam
//   await channel.bindQueue("docs_order_created", MAIN_EXCHANGE, "");
//   await channel.bindQueue("docs_order_retry", RETRY_EXCHANGE, "");
//   await channel.bindQueue("docs_order_dead", DLX_EXCHANGE, "");

//   console.log(
//     "📥 docsService laukia ORDER_CREATED įvykių su retry mechanizmu..."
//   );

//   channel.consume("docs_order_created", async (msg) => {
//     const event = JSON.parse(msg.content.toString());

//     if (event.type !== "ORDER_CREATED") {
//       channel.ack(msg);
//       return;
//     }

//     console.log("📝 Gautas ORDER_CREATED:", event.data);

//     try {
//       const order = event.data;
//       const template = "1760029140328-nomas ligums1.docx";
//       // const data = {
//       //   orderId: order.orderId,
//       //   client_id: order.client_id,
//       //   tool_id: order.tool_id,
//       //   date: order.date,
//       //   date_until: order.date_until,
//       //   pay_sum: order.pay_sum,
//       // };
//       const data = {
//         date: "2025-10-09",
//         nomnieks_vards: "Jonas Jonaitis",
//         nomnieks_adrese: "Vilniaus g. 1",
//         email: "rolandas.macius@gmail.com",
//         phone: "+37067606999",
//         nomas_objekts: "Grąžtas",
//         nomas_summa: "1200 EUR",
//         nomas_termins: "12 mėn.",
//         sutarties_data: "2025-10-09",
//       };
//       const filePath = await generateFromTemplate(template, data);
//       console.log("✅ Dokumentas sugeneruotas:", filePath);

//       // Publikuojame DOCUMENT_GENERATED
//       const docEvent = {
//         type: "DOCUMENT_GENERATED",
//         data: { orderId: order.orderId, filePath },
//       };

//       await channel.assertExchange("doc_events", "fanout", { durable: true });
//       channel.publish("doc_events", "", Buffer.from(JSON.stringify(docEvent)));

//       console.log("📤 DOCUMENT_GENERATED išsiųstas:", docEvent);

//       channel.ack(msg);
//     } catch (err) {
//       console.error("❌ Dokumento generavimo klaida:", err.message);

//       const retries = msg.properties.headers["x-retry-count"] || 0;

//       if (retries >= 3) {
//         console.error("🚫 Per daug bandymų, siunčiame į DLQ");
//         channel.publish(DLX_EXCHANGE, "", Buffer.from(msg.content), {
//           headers: { "x-original-error": err.message },
//         });
//         channel.ack(msg);
//       } else {
//         console.log(`⏳ Bandymas #${retries + 1}, siunčiame į retry queue`);
//         channel.publish(RETRY_EXCHANGE, "", Buffer.from(msg.content), {
//           headers: { "x-retry-count": retries + 1 },
//         });
//         channel.ack(msg);
//       }
//     }
//   });
// }

import { getChannel } from "./connection.js";
import { generateFromTemplate } from "../services/docService.js";
import { sendRpcResponse } from "./utils.js";

/**
 * Paleidžia visus klausytuvus (event + RPC)
 */
export async function startOrderConsumer() {
  const channel = getChannel();

  // 1️⃣ Event-based listener: ORDER_CREATED
  await channel.assertExchange("orders", "fanout", { durable: true });
  const orderQueue = await channel.assertQueue("ORDER_CREATED", {
    durable: true,
  });
  await channel.bindQueue(orderQueue.queue, "orders", "");

  channel.consume(orderQueue.queue, async (msg) => {
    if (!msg) return;
    try {
      const order = JSON.parse(msg.content.toString());
      console.log("📄 [docs-service] Gauta ORDER_CREATED:", order);

      const filePaths = await generateFromTemplate(order);

      console.log("✅ Sugeneruoti dokumentai:", filePaths);

      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(filePaths || null)),
        { correlationId: msg.properties.correlationId }
      );
    } catch (err) {
      console.error("❌ Klaida apdorojant ORDER_CREATED:", err);
    } finally {
      channel.ack(msg);
    }
  });

  // 2️⃣ RPC listener: DOCS_GENERATE_BY_ORDER
  await channel.assertQueue("DOCS_GENERATE_BY_ORDER", { durable: true });
  channel.consume("DOCS_GENERATE_BY_ORDER", async (msg) => {
    try {
      const order = JSON.parse(msg.content.toString());
      console.log("🧾 [docs-service] RPC DOCS_GENERATE_BY_ORDER:", order);

      const filePaths = await generateDocumentsForOrder(order);

      sendRpcResponse(channel, msg, { success: true, files: filePaths });
    } catch (err) {
      sendRpcResponse(channel, msg, { success: false, error: err.message });
    } finally {
      channel.ack(msg);
    }
  });

  console.log("📡 [docs-service] Visi listeneriai paleisti");
}
