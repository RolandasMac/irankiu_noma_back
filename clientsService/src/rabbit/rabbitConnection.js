import amqp from "amqplib";

let channel;

export async function connectRabbit() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    console.log("🐇 [clients-service] RabbitMQ connected");
    return channel;
  } catch (err) {
    console.error("❌ RabbitMQ connection error (clients-service):", err);
    throw err;
  }
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}
