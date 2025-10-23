import { getChannel } from "./connection.js"; // tavo channel getter

function generateUuid() {
  return (
    Math.random().toString() +
    Math.random().toString() +
    Math.random().toString()
  );
}

export async function getClientById(clientId) {
  const channel = getChannel();
  const { queue: replyQueue } = await channel.assertQueue("", {
    exclusive: true,
  });
  const correlationId = generateUuid();

  return new Promise((resolve, reject) => {
    channel.consume(
      replyQueue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          try {
            resolve(JSON.parse(msg.content.toString()));
          } catch (err) {
            reject(err);
          }
        }
      },
      { noAck: true }
    );

    channel.sendToQueue(
      "CLIENTS_REQUEST",
      Buffer.from(JSON.stringify({ clientId })),
      { correlationId, replyTo: replyQueue }
    );
  });
}
