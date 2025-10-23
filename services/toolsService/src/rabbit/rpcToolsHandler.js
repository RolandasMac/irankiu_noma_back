import { getChannel } from "./rabbitConnection.js";
import Tool from "../models/Tool.js"; // tavo Mongoose modelis

export async function startToolsRpcListener() {
  const channel = getChannel();
  const queueName = "TOOLS_REQUEST";

  await channel.assertQueue(queueName, { durable: true });
  console.log(
    `🐇 [tools-service] Listening for RPC requests on "${queueName}"`
  );

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    const { toolId } = JSON.parse(msg.content.toString());

    try {
      const tool = await Tool.findById(toolId).lean();

      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(tool || null)),
        { correlationId: msg.properties.correlationId }
      );
    } catch (err) {
      console.error("❌ Error fetching tool:", err);
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
