import fs from "fs";
import path from "path";
import paths from "../../../../config/paths.js";
import { deleteFile } from "../utils/deleteFiles.js";
const { imageUploadsDir, toolManualsDir, thumbnailsDir } = paths;

export async function saveUpdatedFiles(req, res, next) {
  req.body.manuals_urls = [];
  try {
    const imageUrls = [];
    // Įkelti naujus failus
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filename = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}_${file.originalname}`;
        const filepath = path.join(imageUploadsDir, filename);

        fs.writeFileSync(filepath, file.buffer);
        imageUrls.push(filename);
      }
    } else {
      console.log("📁 No new files to process");
    }

    // Ištrinti pažymėtas nuotraukas
    if (
      req.body.deletedImages &&
      Array.isArray(req.body.deletedImages) &&
      req.body.deletedImages.length > 0
    ) {
      for (const imageUrl of req.body.deletedImages) {
        deleteFile(imageUploadsDir, imageUrl);
      }
    } else {
      console.log("🗑️ There is no image files to delete");
    }

    // Sujungti esamas ir naujas nuotraukas (išfiltruojant pašalintas)
    const existingImages = req.body.existingImages || [];
    const filteredExisting = existingImages.filter(
      (img) => !req.body.deletedImages?.includes(img)
    );
    req.body.images_urls = [...filteredExisting, ...imageUrls];

    // Išsaugome naujas manuals
    if (
      req.files.new_manuals &&
      req.files.new_manuals.length > 0 &&
      req.thumbnailsData.length === req.files.new_manuals.length
    ) {
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
      console.log("There is nno new manuals to process");
    }

    // Pašalinam Ištrintas manuals ir miniatiūros
    if (
      req.body.deletedManuals &&
      Array.isArray(req.body.deletedManuals) &&
      req.body.deletedManuals.length > 0
    ) {
      for (const manual of req.body.deletedManuals) {
        deleteFile(toolManualsDir, manual.manualFilename);
        deleteFile(thumbnailsDir, manual.thumbnailFilename);
      }
    } else {
      console.log("🗑️ There is no manuals to delete");
    }
    // Išsaugome galutinį manuals
    if (!req.body.current_manuals || req.body.current_manuals.length === 0) {
      req.body.current_manuals = [];
    }

    req.body.manuals_urls = [
      ...req.body.current_manuals,
      ...req.body.manuals_urls,
    ];
    next();
  } catch (err) {
    console.error("❌ File processing error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while processing files",
    });
  }
}
