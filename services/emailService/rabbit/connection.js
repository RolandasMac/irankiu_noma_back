import amqp from "amqplib";

let channel;

export async function connectRabbit() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    await channel.assertQueue("SEND_MAIL", { durable: true });
    console.log("🐇 [email-service] RabbitMQ connected");

    connection.on("error", (err) => {
      console.error("❌ RabbitMQ connection error:", err);
    });
    connection.on("close", () => {
      console.error("❌ RabbitMQ connection closed");
      process.exit(1);
    });

    return channel;
  } catch (err) {
    console.error("❌ RabbitMQ connection error:", err);
    throw err;
  }
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}
