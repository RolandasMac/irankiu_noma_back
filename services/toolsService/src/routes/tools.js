import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import { transformBody } from "../middleware/transformBody.js";
import {
  listTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
} from "../controllers/toolsController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import paths from "../../../../config/paths.js";
import { saveFiles } from "../middleware/saveFiles.js";

const { imageUploadsDir } = paths;
const router = express.Router();
const toolSchema = Joi.object({
  toolName: Joi.string().trim().min(1).required(),
  signs: Joi.string().trim().min(1),
  description: Joi.alternatives()
    .try(
      Joi.string().trim().min(1),
      Joi.array().items(Joi.string().trim().min(1))
    )
    .required(),
  images_urls: Joi.array().items(Joi.string()).optional().default([]),
  toolPrice: Joi.number().optional(),
  rentPrice: Joi.number().optional(),
  depozit: Joi.number().optional(),
  rented: Joi.boolean().optional().default(false),
  rented_until: Joi.date().optional().allow(null),
});
// -----Multer-----
if (!fs.existsSync(imageUploadsDir)) {
  try {
    fs.mkdirSync(imageUploadsDir, { recursive: true });
    console.log(`[Doc Service] Sukurtas įkėlimų katalogas: ${imageUploadsDir}`);
  } catch (mkdirErr) {
    console.error(
      `[Doc Service] Klaida kuriant įkėlimų katalogą '${imageUploadsDir}':`,
      mkdirErr
    );
    // Throw klaidą globaliai
    throw new Error(`Serverio klaida: nepavyko sukurti įkėlimų katalogo.`);
  }
}
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB limitas
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const isValid =
      allowed.test(file.mimetype) &&
      allowed.test(path.extname(file.originalname).toLowerCase());
    if (isValid) cb(null, true);
    else cb(new Error("Leidžiami tik paveikslėliai (jpeg, jpg, png, gif)"));
  },
});
// -----------------

router.get("/", listTools);
router.get("/:id", getTool);
router.post("/:id", validateBody(toolSchema), updateTool);
router.delete("/:id", deleteTool);
router.post(
  "/",
  upload.array("images"),
  transformBody,
  validateBody(toolSchema),
  saveFiles,
  createTool
);

export default router;
