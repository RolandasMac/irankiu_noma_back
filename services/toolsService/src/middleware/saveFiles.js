import fs from "fs";
import path from "path";
import paths from "../../../../config/paths.js";

const { imageUploadsDir } = paths;
export async function saveFiles(req, res, next) {
  try {
    if (!fs.existsSync(imageUploadsDir)) {
      fs.mkdirSync(imageUploadsDir, { recursive: true });
    }
    const imageUrls = [];
    for (const file of req.files) {
      const filename = Date.now() + "-" + file.originalname;
      const filepath = path.join(imageUploadsDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      imageUrls.push(`${filename}`);
    }
    console.log("imageUrls", imageUrls);
    req.body.images_urls = [...imageUrls];
  } catch (err) {
    console.error("Serverio klaida:", err);
    res.status(500).json({ success: false, message: "Serverio klaida" });
  }
  next();
}
