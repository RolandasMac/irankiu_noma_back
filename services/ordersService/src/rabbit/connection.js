import amqp from "amqplib";

let channel;

export async function connectRabbit() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    await channel.assertExchange("orders", "fanout", { durable: true });
    console.log("🐇 [orders-service] RabbitMQ connected");
    return channel;
  } catch (err) {
    console.error("❌ RabbitMQ connection error (orders-service):", err);
    throw err;
  }
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}
