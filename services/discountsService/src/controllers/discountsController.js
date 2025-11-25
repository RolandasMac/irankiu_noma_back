import Discount from "../models/Discount.js";
import Tool from "../models/Tool.js";

export async function listDiscounts(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const desc = req.query.desc ? (req.query.desc === "true" ? -1 : 1) : -1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.toolId) {
      filter.tools_id = { $in: [req.query.toolId] };
    }

    // 👑 Ar reikia grąžinti su tools duomenimis?
    const populateTools = req.query.populate === "true";

    const [total, itemsRaw] = await Promise.all([
      Discount.countDocuments(filter),
      Discount.find(filter)
        .sort({ createdAt: desc })
        .skip(skip)
        .limit(limit)
        .populate(
          populateTools
            ? { path: "tools_id", select: "toolName images_urls" }
            : null
        )
        .lean(),
    ]);

    console.log("gauta", total, itemsRaw);
    // 👁️ Jei populate=false, galime duomenis praplėsti rankiniu būdu (optional)
    let items = itemsRaw;
    if (populateTools) {
      items = await Promise.all(
        itemsRaw.map(async (d) => {
          const tools = await Tool.find({ _id: { $in: d.tools_id } })
            .select("toolName images_urls")
            .lean();
          return { ...d, tools };
        })
      );
    }

    res.json({
      success: true,
      message: "Discounts fetched successfully",
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    console.error("❌ listDiscounts error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching discounts",
      error: err.message,
    });
  }
}

export async function getDiscount(req, res) {
  const { id } = req.params;
  const discount = await Discount.findById(id)
    .populate({
      path: "tools_id", // 👈 atitinka lauką schema
      select: "toolName images_urls", // 👈 kokius laukus paimti
    })
    .lean();
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
    // Dabartinė data (be laiko, kad palyginimas būtų dienos tikslumu)
    const today = new Date();
    // today.setHours(0, 0, 0, 0);
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
