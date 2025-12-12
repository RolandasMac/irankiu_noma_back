import fs from "fs";
import path from "path";
import paths from "../../../../config/paths.js";
import Order from "../models/Order.js";
const { generatedDir } = paths;
export async function deleteOldDocs(req, res, next) {
  const { id } = req.params;
  try {
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    const { docs_urls } = await Order.findById(id).select("docs_urls").lean();
    // Ištrinti pažymėtus dokumentus
    if (docs_urls && docs_urls.length > 0) {
      //   console.log(`🗑️ Deleting ${docs_urls.length} marked files`);
      for (const docUrl of docs_urls) {
        try {
          const filepath = path.join(generatedDir, docUrl.url);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            // console.log(`✅ Deleted file: ${docUrl.url}`);
          } else {
            // console.log(`⚠️ File not found: ${docUrl.url}`);
          }
        } catch (err) {
          //   console.error(`❌ Error deleting file ${docUrl.url}:`, err);
        }
      }
    }
    const xx2 = await Order.findByIdAndUpdate(
      id,
      { "docs_urls": [] },
      { new: true }
    )
      .select("docs_urls")
      .lean();
    next();
  } catch (err) {
    console.error("❌ File processing error:", err);
    res.status(500).json({
      success: false,
      message: "Serverio klaida apdorojant failus",
    });
  }
}
