import fs from "fs";
import path from "path";
import paths from "../../../../config/paths.js";

const { imageUploadsDir, toolManualsDir, thumbnailsDir } = paths;
export async function saveFiles(req, res, next) {
  console.log(
    "saveFiles",
    req.files.images,
    req.files.manual,
    req.thumbnailsData
  );
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

    if (req.files.manual.length > 0) {
      const manualFile = req.files.manual[0];
      const manualFilename = Date.now() + "-" + manualFile.originalname;
      const manualFilepath = path.join(toolManualsDir, manualFilename);
      req.body.manual_url = manualFilename;
      fs.writeFileSync(manualFilepath, manualFile.buffer);
    }

    if (req.thumbnailsData) {
      //
      //  req.thumbnailsData = {
      //       fieldname: "thumbnail",
      //       originalname: finalThumbnailFileName,
      //       encoding: "7bit",
      //       mimetype: "image/jpeg",
      //       buffer: thumbnailBuffer,
      //       size: thumbnailBuffer.length,
      //     };

      const thumbnailFile = req.thumbnailsData.buffer;
      const thumbnailFilename = req.thumbnailsData.originalname;
      const thumbnailFilepath = path.join(thumbnailsDir, thumbnailFilename);

      req.body.manualThumbnail_url = thumbnailFilename;
      fs.writeFileSync(thumbnailFilepath, thumbnailFile);
    }

    // req.body.manuals_urls = [...manualsUrls];
  } catch (err) {
    console.error("Serverio klaida:", err);
    res.status(500).json({ success: false, message: "Serverio klaida" });
  }
  next();
}
