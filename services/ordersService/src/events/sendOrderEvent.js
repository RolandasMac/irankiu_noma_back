import { getChannel } from "../rabbit/connection.js";

export async function sendOrderEvent(order) {
  try {
    const channel = getChannel();
    const payload = {
      _id: order._id,
      client_id: order.client_id,
      tool_id: order.tool_id,
      date: order.date,
      date_until: order.date_until,
      pay_sum: order.pay_sum,
      discount: order.discount,
      client_name: order.client_name || "",
      tool_name: order.tool_name || "",
    };

    channel.publish("orders", "", Buffer.from(JSON.stringify(payload)));
    console.log("📤 [orders-service] ORDER_CREATED event sent:", payload._id);
  } catch (err) {
    console.error("❌ Failed to send order event:", err);
  }
}
