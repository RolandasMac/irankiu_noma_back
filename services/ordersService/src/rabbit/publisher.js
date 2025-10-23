import amqp from "amqplib";
import { getChannel } from "./connection.js"; // tavo channel getter
let channel;
// async function getChannel() {
//   if (channel) return channel;
//   const conn = await amqp.connect("amqp://localhost");
//   channel = await conn.createChannel();
//   await channel.assertExchange("order_events", "fanout", { durable: true });
//   return channel;
// }

export async function publishOrderCreated(order) {
  const ch = await getChannel();
  const event = {
    type: "ORDER_CREATED",
    data: order,
  };
  ch.publish("order_events", "", Buffer.from(JSON.stringify(event)));
  console.log("📤 ORDER_CREATED išsiųstas į RabbitMQ");
}
