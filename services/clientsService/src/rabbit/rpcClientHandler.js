import { getChannel } from "./rabbitConnection.js";
import Client from "../models/Client.js"; // tavo Mongoose modelis

export async function startClientRpcListener() {
  const channel = getChannel();
  const queueName = "CLIENTS_REQUEST";

  await channel.assertQueue(queueName, { durable: true });
  // console.log(
  //   `🐇 [clients-service] Listening for RPC requests on "${queueName}"`
  // );

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    const { clientId } = JSON.parse(msg.content.toString());

    try {
      const client = await Client.findOne({ id: clientId }).lean();
      // console.log("client", client);
      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(client || null)),
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
