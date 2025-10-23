import { getChannel } from "./connection.js";
import Discount from "../models/Discount.js"; // tavo Mongoose modelis

export async function startDiscountRpcListener() {
  const channel = getChannel();
  const queueName = "DISCOUNTS_REQUEST";

  await channel.assertQueue(queueName, { durable: true });
  console.log(
    `🐇 [discounts-service] Listening for RPC requests on "${queueName}"`
  );

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    const { toolId, days } = JSON.parse(msg.content.toString());
    console.log("toolId", toolId, days);
    try {
      // const discount = await Discount.findOne({ id: clientId }).lean();
      const today = new Date();
      const discount = await Discount.find({
        tools_id: toolId,
        valid_from: { $lte: today },
        valid_until: { $gte: today },
        min_days: { $lte: days },
        max_days: { $gte: days },
      });

      console.log("discount", discount[0].discount);
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(discount[0].discount || null)),
        { correlationId: msg.properties.correlationId }
      );
    } catch (err) {
      console.error("❌ Error fetching client:", err);
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify({ error: err.message })),
        { correlationId: msg.properties.correlationId }
      );
    } finally {
      channel.ack(msg);
    }
  });
}
