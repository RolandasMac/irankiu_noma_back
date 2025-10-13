import express from "express";
import multer from "multer";
import path from "path";
import paths from "../../../config/paths.js";
import * as controller from "../controllers/docController.js";

const { templatesDir } = paths;
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

export default router;
