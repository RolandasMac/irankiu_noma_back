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

    if (!req.files.manual) {
      return next();
    }

    if (!fs.existsSync(toolManualsDir)) {
      fs.mkdirSync(toolManualsDir, { recursive: true });
    }

    if (
      req.files.manual &&
      req.files.manual.length > 0 &&
      req.thumbnailsData.length === req.files.manual.length
    ) {
      req.body.manuals_urls = [];
      req.files.manual.forEach((manual) => {
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
        "Nepavyko issaugoti manual",
        req.thumbnailsData.length,
        req.files.manual.length,
        req.thumbnailsData
      );
      throw new Error("Nepavyko issaugoti manual");
    }

    // req.body.manuals_urls = [...manualsUrls];
  } catch (err) {
    console.error("Serverio klaida:", err);
    res.status(500).json({ success: false, message: "Serverio klaida" });
  }
  next();
}
