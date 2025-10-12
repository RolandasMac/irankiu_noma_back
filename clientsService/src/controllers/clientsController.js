import Client from "../models/Client.js";
import { v4 as uuidv4 } from "uuid";

export async function listClients(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : null;

  const filter = {};
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ name: re }, { email: re }, { phone: re }, { addres: re }];
  }

  const [total, items] = await Promise.all([
    Client.countDocuments(filter),
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({ success: true, page, limit, total, items });
}

export async function getClient(req, res) {
  const { id } = req.params;
  const client = await Client.findOne({ id: id }).lean();
  if (!client)
    return res
      .status(404)
      .json({ success: false, message: "Client not found" });
  res.json({ success: true, client });
}

export async function createClient(req, res) {
  let { id, name, addres, phone, email } = req.body;
  if (!id) id = uuidv4();

  const exists = await Client.findOne({ id });
  if (exists)
    return res
      .status(409)
      .json({ success: false, message: "Client already exists" });

  const client = new Client({ id, name, addres, phone, email });
  await client.save();

  res.status(201).json({ success: true, client });
}

export async function updateClient(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const client = await Client.findOneAndUpdate({ id }, updates, {
    new: true,
    runValidators: true,
  });
  if (!client)
    return res
      .status(404)
      .json({ success: false, message: "Client not found" });

  res.json({ success: true, client });
}

export async function deleteClient(req, res) {
  const { id } = req.params;
  const client = await Client.findOneAndDelete({ id });
  if (!client)
    return res
      .status(404)
      .json({ success: false, message: "Client not found" });
  res.json({ success: true, message: "Client deleted" });
}
