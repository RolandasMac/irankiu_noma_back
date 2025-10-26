import { getChannel, connectRabbit } from "./connection.js";
import sendMail from "../plugins/emailPlugin.js"; // tavo sendMail funkcija

export async function startConsumer() {
  const channel = getChannel();

  await channel.assertQueue("SEND_MAIL", { durable: true });
  console.log("📨 [email-service] Waiting for SEND_MAIL messages...");

  channel.consume("SEND_MAIL", async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());
    console.log("📬 Got SEND_MAIL:", data);

    try {
      const success = await sendMail(data.email, data.subject, data.html);
      const response = success
        ? { success: true, message: `Email sent to ${data.email}` }
        : { success: false, message: "Failed to send email" };

      channel.sendToQueue(
        msg.properties.replyTo,
        Buffer.from(JSON.stringify(response)),
        { correlationId: msg.properties.correlationId }
      );

      channel.ack(msg);
    } catch (err) {
      console.error("Email error:", err);
      channel.ack(msg);
    }
  });
}
