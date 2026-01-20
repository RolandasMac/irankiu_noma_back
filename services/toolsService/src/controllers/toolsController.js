import Tool from "../models/Tool.js";
import Group from "../models/Groups.js";
import path from "path";
import fs from "fs";
import paths from "../../../../config/paths.js";
import jwt from "jsonwebtoken";
import { deleteFile } from "../utils/deleteFiles.js";

const { imageUploadsDir, templatesDir, toolManualsDir, thumbnailsDir } = paths;
const tokenSecret = process.env.MANUAL_DOWNLOAD_SECRET;
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

export async function listFreeTools(req, res) {
  //perduoti šiuos parametrus iš front-end
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : null;

  // console.log("Užklausos parametrai", page, limit, skip, search);

  const filter = { rented: false };
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ name: re }, { description: re }];
  }

  const [total, items] = await Promise.all([
    Tool.countDocuments(filter),
    Tool.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("required_addons")
      .lean(),
  ]);

  // tool = await Tool.findById(toolId).populate("group").lean();

  // console.log("gauta", total, items);

  res.json({
    success: true,
    message: "Tools listed successfully",
    page,
    limit,
    total,
    items,
  });
}

export async function listFreeToolsForEdit(req, res) {
  //perduoti šiuos parametrus iš front-end
  const toolId = req.params.id;
  // console.log("toolId", toolId);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : null;

  // console.log("Užklausos parametrai", page, limit, skip, search);

  // const filter = { rented: false };
  // if (search) {
  //   const re = new RegExp(search, "i");
  //   filter.$or = [{ name: re }, { description: re }];
  // }

  const filter = {
    $and: [],
  };

  // 1. Logika: laisvi arba konkretus ID
  if (toolId) {
    filter.$and.push({
      $or: [{ rented: false }, { _id: toolId }],
    });
  } else {
    filter.$and.push({ rented: false });
  }

  // 2. Paieška
  if (search) {
    const re = new RegExp(search, "i");
    filter.$and.push({
      $or: [{ toolName: re }, { description: re }],
    });
  }

  const [total, items] = await Promise.all([
    Tool.countDocuments(filter),
    Tool.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("required_addons")
      .lean(),
  ]);

  // tool = await Tool.findById(toolId).populate("group").lean();

  // console.log("gauta", total, items);

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
  // console.log("createTool");
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
    group,
    required_addons,
    manuals_urls,
    // manualThumbnail_url,
  } = req.body;
  if (
    !toolName ||
    !description ||
    isNaN(toolPrice) ||
    isNaN(rentPrice) ||
    isNaN(depozit) ||
    !group
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
    group,
    required_addons,
    manuals_urls,
    // manualThumbnail_url,
  });
  await tool.save();

  res.status(201).json({
    success: true,
    message: "Tool created successfully",
    files: req.files,
    images_urls: images_urls,
  });
}

export async function updateTool(req, res) {
  const { id } = req.params;
  const updates = req.body;
  // console.log("Updates", req.body);
  updates.rented_until = mergeDateWithCurrentTime(updates.rented_until);

  // console.log("🔄 Updating tool:", {
  //   id,
  //   updates: { ...updates, images_urls: updates.images_urls?.length },
  // });

  try {
    const tool = await Tool.findOneAndUpdate({ _id: id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!tool) {
      // console.log("❌ Tool not found:", id);
      return res.status(404).json({
        success: false,
        message: "Įrankis nerastas",
      });
    }

    // console.log("✅ Tool updated successfully:", tool._id);
    res.json({
      success: true,
      tool,
      message: "Įrankis sėkmingai atnaujintas",
    });
  } catch (error) {
    console.error("❌ Error updating tool:", error);
    res.status(500).json({
      success: false,
      message: "Serverio klaida atnaujinant įrankį",
      error: error.message,
    });
  }
}

export async function deleteTool(req, res) {
  const { id } = req.params;
  // console.log("Trynimas id", id);

  try {
    // 1️⃣ Randame įrankį pagal ID
    const tool = await Tool.findById(id);
    if (!tool) {
      return res
        .status(404)
        .json({ success: false, message: "Įrankis nerastas" });
    }

    // 2️⃣ Pašaliname susijusius failus, jei jie egzistuoja
    if (tool.images_urls && Array.isArray(tool.images_urls)) {
      for (const imgUrl of tool.images_urls) {
        deleteFile(imageUploadsDir, imgUrl);
      }
    } else {
      console.log("There is no imege files to delete");
    }
    // Pašalinam thumbnails ir manuals
    if (tool.manuals_urls && Array.isArray(tool.manuals_urls)) {
      for (const manual of tool.manuals_urls) {
        deleteFile(toolManualsDir, manual.manualFilename);
        deleteFile(thumbnailsDir, manual.thumbnailFilename);
      }
    } else {
      console.log("There is no manuals and thumbnails files to delete");
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

export async function searchTool(req, res) {
  try {
    const search = req.query.search?.trim();
    // console.log(search);
    let query = {};
    if (search) {
      // Paieška be didžiųjų/mažųjų raidžių jautrumo
      query = { toolName: { $regex: search, $options: "i" } };
    }

    const tools = await Tool.find(query).limit(20); // limit kad neužkrautų
    res.json({ success: true, data: tools });
  } catch (error) {
    console.error("❌ Klaida ieškant įrankių:", error);
    res.status(500).json({ success: false, message: "Serverio klaida" });
  }
}

export async function listGroups(req, res) {
  // console.log("Veikia groups");
  try {
    const groups = await Group.find();
    res.json({ success: true, groups });
  } catch (error) {
    console.error("❌ Klaida ieškant įrankių:", error);
    res.status(500).json({ success: false, message: "Serverio klaida" });
  }
}

export async function getTemplates(req, res) {
  // const { group } = req.params;
  // const dir = path.join("templates");

  if (!fs.existsSync(templatesDir)) {
    return res.status(404).json({ success: false, message: "Grupė nerasta" });
  }

  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".docx"));
  res.json({ success: true, files });
}

// ✅ CREATE
export async function createGroup(req, res) {
  try {
    const { group, templates } = req.body;

    if (!group || !templates) {
      return res
        .status(400)
        .json({ success: false, message: "Trūksta duomenų" });
    }

    const exists = await Group.findOne({ group });
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "Grupė jau egzistuoja" });
    }

    const newGroup = await Group.create({ group, templates });

    res.status(201).json({ success: true, group: newGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: "Klaida kuriant grupę" });
  }
}

// 📥 READ ALL
export async function getGroups(req, res) {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, message: "Klaida gaunant grupes" });
  }
}

// 📄 READ ONE
export async function getGroupById(req, res) {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Grupė nerasta" });
    }

    res.json({ success: true, group });
  } catch (err) {
    res.status(400).json({ success: false, message: "Neteisingas ID" });
  }
}

// ✏️ UPDATE
export async function updateGroup(req, res) {
  try {
    const { group, templates } = req.body;

    const updated = await Group.findByIdAndUpdate(
      req.params.id,
      { group, templates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Grupė nerasta" });
    }

    res.json({ success: true, group: updated });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Klaida atnaujinant grupę" });
  }
}

// 🗑 DELETE
export async function deleteGroup(req, res) {
  try {
    const deleted = await Group.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Grupė nerasta" });
    }

    res.json({ success: true, message: "Grupė ištrinta" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Klaida trinant grupę" });
  }
}

export async function getTokenForManuals(req, res) {
  const toolId = req.params.toolId;

  if (!toolId) {
    return res.status(404).json({ message: "Manual not available" });
  }

  const token = jwt.sign(
    {
      toolId: toolId,
      type: "manual_download",
    },
    tokenSecret,
    { expiresIn: "10d" }
  );

  res.json({ token });
}

export async function getManuals(req, res) {
  try {
    const payload = jwt.verify(
      req.query.token,
      process.env.MANUAL_DOWNLOAD_SECRET
    );

    if (payload.type !== "manual_download") {
      return res.status(403).end();
    }
    // return res
    //   .status(200)
    //   .json({ message: "Download successful", token: req.query.token });
    // console.log("payload.toolId", payload.toolId);
    const manuals = await Tool.findOne(
      { _id: payload.toolId },
      { manuals_urls: 1, _id: 0 }
    ).lean();
    if (!manuals)
      return res
        .status(200)
        .json({ success: false, message: "Manual not found" });
    return res.json({
      success: true,
      message: "Tool found successfully",
      manuals: manuals,
    });

    // const filePath = path.join(toolManualsDir, manual.manualFilename);
    // res.download(filePath);
  } catch (err) {
    return res.status(403).json({ message: "Token expired or invalid" });
  }
}
// Download one manual
export async function downloadManual(req, res) {
  try {
    const { token } = req.query;
    const { filename } = req.params;

    console.log("Veikia", token, filename);
    if (!token || !filename) {
      return res.status(400).json({ message: "Missing token or filename" });
    }

    // 🔐 Tikrinam tokeną
    const payload = jwt.verify(token, process.env.MANUAL_DOWNLOAD_SECRET);

    if (payload.type !== "manual_download") {
      return res.status(403).json({ message: "Invalid token type" });
    }

    // 📄 Failo kelias
    const filePath = path.join(toolManualsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Manual not found" });
    }

    // 🔥 SVARBIAUSIA DALIS (čia mano siūlymas)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // 📤 Siunčiam failą
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(403).json({ message: "Token expired or invalid" });
  }
}

// --------------------------------------------------------------------------------------
// Util functions
// --------------------------------------------------------------------------------------

function mergeDateWithCurrentTime(dateString) {
  const datePart = new Date(dateString); // tik data iš input
  const now = new Date(); // dabartinis laikas

  // Sukuriam naują datą su data iš input + laiku iš dabartinio
  const merged = new Date(
    datePart.getFullYear(),
    datePart.getMonth(),
    datePart.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  return merged;
}
