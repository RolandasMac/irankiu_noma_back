import { getChannel } from "./connection.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Gauti galiojančias nuolaidas pagal toolId ir dienų skaičių
 * @param {string} toolId
 * @param {number} days
 * @returns {Promise<Array>} masyvas nuolaidų objektų
 */
export async function getDiscount(toolId, days) {
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
      "DISCOUNTS_REQUEST",
      Buffer.from(JSON.stringify({ toolId, days })),
      { correlationId, replyTo: q.queue }
    );
  });
}
