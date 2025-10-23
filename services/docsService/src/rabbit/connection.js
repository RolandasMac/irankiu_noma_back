// rabbit/connection.js
import amqp from "amqplib";

let channel;

export async function connectRabbit() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await channel.assertExchange("orders", "fanout", { durable: true });

    console.log("🐇 RabbitMQ connected and exchange 'orders' ready");

    return channel;
  } catch (err) {
    console.error("❌ RabbitMQ connection failed:", err);
    throw err;
  }
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}
