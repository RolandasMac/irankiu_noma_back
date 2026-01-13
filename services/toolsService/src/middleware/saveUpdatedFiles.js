import fs from "fs";
import path from "path";
import paths from "../../../../config/paths.js";

const { imageUploadsDir, thumbnailsDir, toolManualsDir } = paths;

export async function saveUpdatedFiles(req, res, next) {
  req.body.manuals_urls = [];
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

    // Išsaugome naujas manuals

    if (
      req.files.new_manuals &&
      req.files.new_manuals.length > 0 &&
      req.thumbnailsData.length === req.files.new_manuals.length
    ) {
      console.log(
        "Čia veikia palyginimas",
        req.files.new_manuals.length,
        req.thumbnailsData.length
      );

      req.files.new_manuals.forEach((manual) => {
        // const manualFile = manual;
        const manualFilename = Date.now() + "-" + manual.originalname;
        const manualFilepath = path.join(toolManualsDir, manualFilename);
        const manual_url = {
          manualFilename: manualFilename,
          thumbnailFilename: null,
        };
        fs.writeFileSync(manualFilepath, manual.buffer);

        const thumbnail = req.thumbnailsData.find(
          (thumbnail) => thumbnail.originalname === manual.originalname
        );
        const thumbnailFile = thumbnail.buffer;
        const thumbnailFilename = thumbnail.thumbnailName;
        const thumbnailFilepath = path.join(thumbnailsDir, thumbnailFilename);

        manual_url.thumbnailFilename = thumbnailFilename;
        fs.writeFileSync(thumbnailFilepath, thumbnailFile);
        req.body.manuals_urls.push(manual_url);
      });
    } else {
      console.log(
        "Nėra naujos instrukcijos ar miniatiūros"
        // req.thumbnailsData.length,
        // req.files.manual.length,
        // req.thumbnailsData
      );
      // throw new Error("Nepavyko issaugoti manual");
    }

    // Pašalinam Ištrintas manuals ir miniatiūros
    if (req.body.deletedManuals && req.body.deletedManuals.length > 0) {
      req.body.deletedManuals.forEach((manual) => {
        const manualFilepath = path.join(toolManualsDir, manual.manualFilename);
        fs.unlinkSync(manualFilepath);
        const thumbnailFilepath = path.join(
          thumbnailsDir,
          manual.thumbnailFilename
        );
        fs.unlinkSync(thumbnailFilepath);
      });
      console.log(`✅ Deleted ${req.body.deletedManuals.length} manuals`);
    }
    // Išsaugome galutinį manuals
    if (!req.body.current_manuals) req.body.current_manuals = [];
    req.body.manuals_urls = [
      ...req.body.current_manuals,
      ...req.body.manuals_urls,
    ];
    console.log("req.body.manuals_urls", req.body.manuals_urls);
    next();
  } catch (err) {
    console.error("❌ File processing error:", err);
    res.status(500).json({
      success: false,
      message: "Serverio klaida apdorojant failus",
    });
  }
}
