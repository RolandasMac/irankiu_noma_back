import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import paths from "../../../config/paths.js";
import * as controller from "../controllers/docController.js";

const { templatesDir, generatedDir } = paths;
const router = express.Router();

const storage = multer.diskStorage({
  destination: templatesDir,
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

router.post(
  "/templates/upload",
  upload.single("template"),
  controller.uploadTemplate
);
router.get("/templates", controller.getTemplates);
router.post(
  "/documents/generate",
  express.json({ limit: "2mb" }),
  controller.generateDocument
);

router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  // const filePath = path.join(process.cwd(), "store", "documents", filename);
  const filePath = path.join(generatedDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Failas nerastas");
  }
  // console.log("filename", generatedDir, filename);
  // return res.status(200).send({
  //   success: true,
  //   message: "Failas atsisiuntas sekoje",
  //   filename,
  //   generatedDir,
  // });

  // Nustatome antraštes, kad naršyklė atsisiųstų failą
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Klaida siunčiant failą:", err);
      res.status(500).send("Nepavyko atsisiųsti failo");
    }
  });
});

export default router;
