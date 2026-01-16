import { getChannel } from "./rabbitConnection.js";
import Tool from "../models/Tool.js";
// import Group from "../models/Groups.js";
import { createToken } from "../utils/createToken.js";
export async function startToolsRpcListener() {
  const channel = getChannel();
  const queueName = "TOOLS_REQUEST";

  await channel.assertQueue(queueName, { durable: true });
  console.log(
    `🐇 [tools-service] Listening for RPC requests on "${queueName}"`
  );

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    const { toolId, action, data } = JSON.parse(msg.content.toString());

    try {
      let tool = null;
      if (action === "get-tool") {
        // tool = await Tool.findById(toolId).lean();
        tool = await Tool.findById(toolId).populate("group").lean();
        const token = createToken(toolId);
        tool.manualsToken = token;
      } else if (action === "update-tool") {
        tool = await Tool.findByIdAndUpdate(toolId, data, { new: true });
      }

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
