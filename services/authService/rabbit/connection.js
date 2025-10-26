import amqp from "amqplib";

let channel;

/**
 * Sukuria vieną bendrą RabbitMQ kanalą
 */
export async function connectRabbit() {
  try {
    const connection = await amqp.connect("amqp://localhost");

    channel = await connection.createChannel();

    // Užtikriname, kad pagrindinė RPC eilė egzistuoja
    await channel.assertQueue("SEND_MAIL", { durable: true });

    console.log("🐇 [auth-service] RabbitMQ connected and queue initialized");

    // Kai RabbitMQ atsijungia – log ir išėjimas
    connection.on("close", () => {
      console.error("❌ RabbitMQ connection closed");
      process.exit(1);
    });

    connection.on("error", (err) => {
      console.error("❌ RabbitMQ connection error:", err);
    });

    return channel;
  } catch (err) {
    console.error("❌ RabbitMQ connection error:", err);
    throw err;
  }
}

/**
 * Gražina esamą kanalą (jei nesukurtas – meta klaidą)
 */
export function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}
