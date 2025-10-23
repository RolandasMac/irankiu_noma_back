export function sendRpcResponse(channel, msg, data) {
  channel.sendToQueue(
    msg.properties.replyTo,
    Buffer.from(JSON.stringify(data)),
    { correlationId: msg.properties.correlationId }
  );
}
