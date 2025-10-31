import { getChannel } from "./connection.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Įrankio paieška per RPC.
 * @param {string} toolId
 * @returns {Promise<object|null>} tool object or null
 */
export async function generateDocs(order, templates) {
  const channel = getChannel();
  const correlationId = uuidv4();
  const q = await channel.assertQueue("", { exclusive: true }); // temp reply queue

  return new Promise((resolve, reject) => {
    channel.consume(
      q.queue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          const data = JSON.parse(msg.content.toString());
          resolve(data);
        }
      },
      { noAck: true }
    );

    channel.sendToQueue(
      "ORDER_CREATED",
      Buffer.from(JSON.stringify({ order, templates })),
      { correlationId, replyTo: q.queue }
    );
  });
}
