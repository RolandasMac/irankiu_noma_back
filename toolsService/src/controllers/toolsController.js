import Tool from "../models/Tool.js";
import { v4 as uuidv4 } from "uuid";

export async function listTools(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : null;

  const filter = {};
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ name: re }, { description: re }];
  }

  const [total, items] = await Promise.all([
    Tool.countDocuments(filter),
    Tool.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({ success: true, page, limit, total, items });
}

export async function getTool(req, res) {
  const { id } = req.params;
  const tool = await Tool.findOne({ _id: id }).lean();
  if (!tool)
    return res.status(404).json({ success: false, message: "Tool not found" });
  res.json({ success: true, tool });
}

export async function createTool(req, res) {
  let { name, description, images_urls, price, depozit, rented, rented_until } =
    req.body;
  // if (!id) id = uuidv4();

  // const exists = await Tool.findOne({ id });
  // if (exists)
  //   return res
  //     .status(409)
  //     .json({ success: false, message: "Tool already exists" });

  const tool = new Tool({
    name,
    description,
    images_urls,
    price,
    depozit,
    rented,
    rented_until,
  });
  await tool.save();

  res.status(201).json({ success: true, tool });
}

export async function updateTool(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const tool = await Tool.findOneAndUpdate({ id }, updates, {
    new: true,
    runValidators: true,
  });
  if (!tool)
    return res.status(404).json({ success: false, message: "Tool not found" });

  res.json({ success: true, tool });
}

export async function deleteTool(req, res) {
  const { id } = req.params;
  const tool = await Tool.findOneAndDelete({ id });
  if (!tool)
    return res.status(404).json({ success: false, message: "Tool not found" });

  res.json({ success: true, message: "Tool deleted" });
}
