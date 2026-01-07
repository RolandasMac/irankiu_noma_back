import fs from "fs";
import path from "path";
import paths from "../../../../config/paths.js";

const { imageUploadsDir, toolManualsDir } = paths;
export async function saveFiles(req, res, next) {
  console.log("saveFiles", req.files.images);
  try {
    if (!fs.existsSync(imageUploadsDir)) {
      fs.mkdirSync(imageUploadsDir, { recursive: true });
    }
    const imageUrls = [];
    for (const file of req.files.images) {
      const filename = Date.now() + "-" + file.originalname;
      const filepath = path.join(imageUploadsDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      imageUrls.push(`${filename}`);
    }
    console.log("imageUrls", imageUrls);
    req.body.images_urls = [...imageUrls];
    // save manuals
    if (!fs.existsSync(toolManualsDir)) {
      fs.mkdirSync(toolManualsDir, { recursive: true });
    }
    const manualsUrls = [];
    for (const file of req.files.manual) {
      const filename = Date.now() + "-" + file.originalname;
      const filepath = path.join(toolManualsDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      manualsUrls.push(`${filename}`);
    }
    console.log("imageUrls", manualsUrls);
    req.body.manuals_urls = [...manualsUrls];
  } catch (err) {
    console.error("Serverio klaida:", err);
    res.status(500).json({ success: false, message: "Serverio klaida" });
  }
  next();
}
