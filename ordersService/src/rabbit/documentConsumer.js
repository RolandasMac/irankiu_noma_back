import amqp from "amqplib";
import Order from "../models/Order.js";

export async function startDocConsumer() {
  const conn = await amqp.connect("amqp://localhost");
  const channel = await conn.createChannel();

  await channel.assertExchange("doc_events", "fanout", { durable: true });
  const q = await channel.assertQueue("orders_doc_generated", {
    durable: true,
  });
  await channel.bindQueue(q.queue, "doc_events", "");

  console.log("📥 ordersService laukia DOCUMENT_GENERATED įvykių...");

  channel.consume(q.queue, async (msg) => {
    const event = JSON.parse(msg.content.toString());
    if (event.type === "DOCUMENT_GENERATED") {
      console.log("📄 Gauta info, kad sugeneruotas dokumentas:", event.data);

      const { orderId, filePath } = event.data;
      await Order.findByIdAndUpdate(orderId, {
        $push: { docs_urls: { type: "sutartis", url: filePath } },
      });

      console.log(`✅ Atnaujintas order ${orderId} su dokumentu: ${filePath}`);
    }

    channel.ack(msg);
  });
}
