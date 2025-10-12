import Discount from "../models/Discount.js";

export async function listDiscounts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.tool_id) {
    filter.tols_id = { $in: [req.query.tool_id] };
  }

  const [total, items] = await Promise.all([
    Discount.countDocuments(filter),
    Discount.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.json({ success: true, page, limit, total, items });
}

export async function getDiscount(req, res) {
  const { id } = req.params;
  const discount = await Discount.findById(id).lean();
  if (!discount)
    return res
      .status(404)
      .json({ success: false, message: "Discount not found" });

  res.json({ success: true, discount });
}

export async function createDiscount(req, res) {
  const discount = new Discount(req.body);
  await discount.save();
  res.status(201).json({ success: true, discount });
}

export async function updateDiscount(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const discount = await Discount.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!discount)
    return res
      .status(404)
      .json({ success: false, message: "Discount not found" });

  res.json({ success: true, discount });
}

export async function deleteDiscount(req, res) {
  const { id } = req.params;
  const discount = await Discount.findByIdAndDelete(id);
  if (!discount)
    return res
      .status(404)
      .json({ success: false, message: "Discount not found" });

  res.json({ success: true, message: "Discount deleted" });
}
export async function getDiscountsByToolId(req, res) {
  try {
    const { toolId } = req.params;
    console.log("toolId:", toolId);
    // Dabartinė data (be laiko, kad palyginimas būtų dienos tikslumu)
    const today = new Date();
    // today.setHours(0, 0, 0, 0);
    console.log("today", today);
    // Ieškome visų, kurių galiojimo laikotarpis apima šiandieną
    const discounts = await Discount.find({
      tools_id: toolId, // Mongoose automatiškai tikrina masyve (nereikia $in)
      valid_from: { $lte: today },
      valid_until: { $gte: today },
    });

    if (!discounts.length) {
      return res.status(404).json({
        success: false,
        message: "Šiuo metu nėra galiojančių nuolaidų šiam įrankiui.",
      });
    }

    res.json({
      success: true,
      count: discounts.length,
      data: discounts,
    });
  } catch (err) {
    console.error("Klaida ieškant nuolaidų:", err);
    res.status(500).json({
      success: false,
      message: "Serverio klaida ieškant nuolaidų.",
    });
  }
}
