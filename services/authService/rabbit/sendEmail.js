import { getChannel } from "./connection.js";
import { v4 as uuidv4 } from "uuid";
/**
 * RPC funkcija, siunčianti prašymą el. pašto siuntimui
 * @param {object} order - duomenys apie užsakymą / gavėją
 * @returns {Promise<object>} - serverio atsakymas
 */
export async function sendEmail(order) {
  const channel = getChannel();
  const correlationId = uuidv4();

  // Sukuriame laikiną „callback“ eilę atsakymui gauti
  const q = await channel.assertQueue("", { exclusive: true });

  return new Promise((resolve, reject) => {
    // 10 sekundžių timeout — jei nėra atsakymo, nutraukiam
    const timeout = setTimeout(() => {
      reject(new Error("⏱️ Timeout: no response from email-service"));
    }, 10000);

    // Laukiame atsakymo
    channel.consume(
      q.queue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          clearTimeout(timeout);
          const data = JSON.parse(msg.content.toString());
          resolve(data);
        }
      },
      { noAck: true }
    );

    // Siunčiame žinutę į „email-service“ per RPC
    channel.sendToQueue("SEND_MAIL", Buffer.from(JSON.stringify(order)), {
      correlationId,
      replyTo: q.queue,
    });

    console.log("📤 [auth-service] Sent SEND_MAIL request:", order);
  });
}
