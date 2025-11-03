import fs from "fs";
import path from "path";
import paths from "../../../../config/paths.js";

const { imageUploadsDir } = paths;

export async function saveUpdatedFiles(req, res, next) {
  try {
    console.log("🔄 Starting file processing...");

    if (!fs.existsSync(imageUploadsDir)) {
      fs.mkdirSync(imageUploadsDir, { recursive: true });
    }

    const imageUrls = [];

    // Įkelti naujus failus
    if (req.files && req.files.length > 0) {
      console.log(`📁 Processing ${req.files.length} new files`);

      for (const file of req.files) {
        const filename = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}_${file.originalname}`;
        const filepath = path.join(imageUploadsDir, filename);

        fs.writeFileSync(filepath, file.buffer);
        imageUrls.push(filename);

        console.log(`✅ Saved new file: ${filename}`);
      }
    } else {
      console.log("📁 No new files to process");
    }

    // Ištrinti pažymėtas nuotraukas
    if (req.body.deletedImages && req.body.deletedImages.length > 0) {
      console.log(`🗑️ Deleting ${req.body.deletedImages.length} marked files`);

      for (const imageUrl of req.body.deletedImages) {
        try {
          const filepath = path.join(imageUploadsDir, imageUrl);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`✅ Deleted file: ${imageUrl}`);
          } else {
            console.log(`⚠️ File not found: ${imageUrl}`);
          }
        } catch (err) {
          console.error(`❌ Error deleting file ${imageUrl}:`, err);
        }
      }
    }

    // Sujungti esamas ir naujas nuotraukas (išfiltruojant pašalintas)
    const existingImages = req.body.existingImages || [];
    const filteredExisting = existingImages.filter(
      (img) => !req.body.deletedImages?.includes(img)
    );

    req.body.images_urls = [...filteredExisting, ...imageUrls];

    console.log("📊 File processing result:", {
      existing: filteredExisting.length,
      new: imageUrls.length,
      total: req.body.images_urls.length,
    });

    next();
  } catch (err) {
    console.error("❌ File processing error:", err);
    res.status(500).json({
      success: false,
      message: "Serverio klaida apdorojant failus",
    });
  }
}
