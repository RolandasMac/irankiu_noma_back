import Tool from "../models/Tool.js";
// import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import paths from "../../../config/paths.js";

const { imageUploadsDir } = paths;
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

  res.json({
    success: true,
    message: "Tools listed successfully",
    page,
    limit,
    total,
    items,
  });
}

export async function getTool(req, res) {
  const { id } = req.params;
  const tool = await Tool.findOne({ _id: id }).lean();
  if (!tool)
    return res.status(404).json({ success: false, message: "Tool not found" });
  res.json({ success: true, message: "Tool found successfully", tool });
}

export async function createTool(req, res) {
  let {
    toolName,
    description,
    signs,
    toolPrice,
    rentPrice,
    depozit,
    rented,
    rented_until,
    images_urls,
  } = req.body;
  if (
    !toolName ||
    !description ||
    isNaN(toolPrice) ||
    isNaN(rentPrice) ||
    isNaN(depozit)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  // const images_urls = [];
  // if (req.files.length !== 0) {
  //   req.files.map((file) => images_urls.push(file.filename));
  // }
  const tool = new Tool({
    toolName,
    description,
    signs,
    toolPrice,
    rentPrice,
    images_urls,
    depozit,
    rented,
    rented_until,
  });
  await tool.save();

  res
    .status(201)
    .json({
      success: true,
      message: "Tool created successfully",
      files: req.files,
      images_urls: images_urls,
    });
}

export async function updateTool(req, res) {
  const { id } = req.params;
  const updates = req.body;
  console.log("Updates", id, updates);
  const tool = await Tool.findOneAndUpdate({ _id: id }, updates, {
    new: true,
    runValidators: true,
  });
  if (!tool)
    return res.status(404).json({ success: false, message: "Tool not found" });

  res.json({ success: true, tool, message: "Tool updated" });
}

// export async function deleteTool(req, res) {
//   const { id } = req.params;
//   console.log("Trynimas id", id);

//   const tool = await Tool.findOneAndDelete({ _id: id });
//   if (!tool)
//     return res.status(404).json({ success: false, message: "Tool not found" });

//   res.json({ success: true, message: "Tool deleted" });
// }
export async function deleteTool(req, res) {
  const { id } = req.params;
  console.log("Trynimas id", id);

  try {
    // 1️⃣ Randame įrankį pagal ID
    const tool = await Tool.findById(id);
    if (!tool) {
      return res
        .status(404)
        .json({ success: false, message: "Įrankis nerastas" });
    }

    // 2️⃣ Pašaliname susijusius failus, jei jie egzistuoja
    if (Array.isArray(tool.images_urls)) {
      for (const imgUrl of tool.images_urls) {
        // Jei saugomas pilnas kelias arba tik failo pavadinimas
        const filename = path.basename(imgUrl);
        const filePath = path.join(imageUploadsDir, filename);

        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[DELETE] Ištrintas failas: ${filePath}`);
          } else {
            console.warn(`[WARN] Failas nerastas: ${filePath}`);
          }
        } catch (err) {
          console.error(`[ERROR] Klaida trinant failą ${filePath}:`, err);
        }
      }
    }

    // 3️⃣ Ištriname įrankį iš DB
    await Tool.findByIdAndDelete(id);
    res.json({ success: true, message: "Įrankis ir failai ištrinti" });
  } catch (error) {
    console.error("Klaida trinant įrankį:", error);
    res
      .status(500)
      .json({ success: false, message: "Serverio klaida trinant įrankį" });
  }
}
