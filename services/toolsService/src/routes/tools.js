import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import { transformBody } from "../middleware/transformBody.js";
import {
  createThumbnailsMiddleware,
  updateThumbnailsMiddleware,
} from "../middleware/createThumbnail.js";
import {
  listTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  listFreeTools,
  searchTool,
  listGroups,
  getTemplates,
  listFreeToolsForEdit,
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
} from "../controllers/toolsController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import paths from "../../../../config/paths.js";
import { saveFiles } from "../middleware/saveFiles.js";
import { checkRole } from "../middleware/checkRole.js";
import { transformUpdateBody } from "../middleware/transformUpdateBody.js";
import { validateBeforeUpload } from "../middleware/validateBeforeUpload.js";
import { saveUpdatedFiles } from "../middleware/saveUpdatedFiles.js";
import Addon from "../models/Addon.js";

const { imageUploadsDir } = paths;
const router = express.Router();

// -------------------------------------
//    Schemas
// -------------------------------------

const toolSchema = Joi.object({
  toolName: Joi.string().trim().min(1).required(),
  signs: Joi.string().trim().allow("", null).optional(),
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
  group: Joi.string().required(),
  required_addons: Joi.array().items(Joi.string()).optional().allow(null),
});

// Pagrindinė schema pirmajai validacijai (be failų)
export const basicToolSchema = Joi.object({
  toolName: Joi.string().required().min(1).max(255),
  description: Joi.alternatives()
    .try(Joi.array().items(Joi.string().min(1)), Joi.string().min(1))
    .required(),
  signs: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  toolPrice: Joi.number().min(0).required(),
  rentPrice: Joi.number().min(0).required(),
  depozit: Joi.number().min(0).required(),
  rented: Joi.boolean().default(false),
  rented_until: Joi.date().allow(null),
  existingImages: Joi.array().items(Joi.string()),
  deletedImages: Joi.array().items(Joi.string()),
  group: Joi.string().required(),
  // required_addons: Joi.array().items(Joi.string()),
  required_addons: Joi.array().items(Joi.string()).optional().allow(null),
});

// Pilna schema antrajai validacijai (su failais)
export const fullToolSchema = Joi.object({
  toolName: Joi.string().required().min(1).max(255),
  description: Joi.array().items(Joi.string().min(1)).required(),
  signs: Joi.array().items(Joi.string()),
  toolPrice: Joi.number().min(0).required(),
  rentPrice: Joi.number().min(0).required(),
  depozit: Joi.number().min(0).required(),
  rented: Joi.boolean().default(false),
  rented_until: Joi.date().allow(null),
  images_urls: Joi.array().items(Joi.string()).required(),
  group: Joi.string().required(),
  required_addons: Joi.array().items(Joi.string()),
});

// -----Multer-----
if (!fs.existsSync(imageUploadsDir)) {
  try {
    fs.mkdirSync(imageUploadsDir, { recursive: true });
    // console.log(`[Doc Service] Sukurtas įkėlimų katalogas: ${imageUploadsDir}`);
  } catch (mkdirErr) {
    console.error(
      `[Tool Service] Klaida kuriant įkėlimų katalogą '${imageUploadsDir}':`,
      mkdirErr
    );
    // Throw klaidą globaliai
    throw new Error(`Serverio klaida: nepavyko sukurti įkėlimų katalogo.`);
  }
}
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const isValid =
      allowed.test(file.mimetype) &&
      allowed.test(path.extname(file.originalname).toLowerCase());
    if (isValid) cb(null, true);
    else
      cb(
        new Error("Leidžiami tik paveikslėliai (jpeg, jpg, png, gif) ir pdf.")
      );
  },
});

// -----------------
router.get("/search", checkRole(["admin"]), searchTool);
router.get("/", checkRole(["admin", "manager"]), listTools);
router.get("/free-tools", checkRole(["admin", "manager"]), listFreeTools);
router.get(
  "/free-tools-for-edit/:id",
  checkRole(["admin", "manager"]),
  listFreeToolsForEdit
);
router.post(
  "/",
  checkRole(["admin"]),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "manual", maxCount: 1 },
  ]),
  createThumbnailsMiddleware,
  transformBody,
  validateBody(toolSchema),
  saveFiles,
  createTool
);
router.put(
  "/:id",
  checkRole(["admin"]),
  // upload.array("images"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "manual", maxCount: 1 },
  ]),
  //reikia pataisyti!!!!!!!!!!
  updateThumbnailsMiddleware,

  transformUpdateBody,
  validateBeforeUpload(basicToolSchema),

  // Reikia pataisyti!!!!!!!!!!
  saveUpdatedFiles,
  validateBody(fullToolSchema),
  updateTool
);
router.get("/get-groups", checkRole(["admin", "manager"]), listGroups);
router.get("/get-templates", checkRole(["admin", "manager"]), getTemplates);

// CREATE
router.post("/create-group", checkRole(["admin", "manager"]), createGroup);

// READ ALL
router.get("/groups", checkRole(["admin", "manager"]), getGroups);

// READ ONE
router.get("/groups/:id", checkRole(["admin", "manager"]), getGroupById);

// UPDATE
router.put("/groups/:id", checkRole(["admin", "manager"]), updateGroup);

// DELETE
router.delete("/groups/:id", checkRole(["admin", "manager"]), deleteGroup);

// =========================
// CREATE – POST /addons
// =========================
router.post("/create-addon", async (req, res) => {
  // console.log("Gauta", req.body);
  try {
    const addon = new Addon(req.body);
    await addon.save();
    res.status(201).json({ success: true, addon });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// =========================
// READ ALL – GET /addons
// =========================
router.get("/get-addons", async (req, res) => {
  try {
    const addons = await Addon.find();
    res.status(200).json({ success: true, addons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// READ ONE – GET /addons/:id
// =========================
router.get("/addon/:id", async (req, res) => {
  try {
    const addon = await Addon.findById(req.params.id);
    if (!addon) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, addon });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================
// UPDATE – PUT /addons/:id
// =========================
router.put("/addon/:id", async (req, res) => {
  try {
    const addon = await Addon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!addon)
      return res.status(404).json({ success: false, error: "Not found" });

    res.json({ success: true, addon });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================
// DELETE – DELETE /addons/:id
// =========================
router.delete("/addon/:id", async (req, res) => {
  try {
    const addon = await Addon.findByIdAndDelete(req.params.id);

    if (!addon) return res.status(404).json({ error: "Not found" });

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.get("/:id", checkRole(["admin", "manager"]), getTool);
router.delete("/:id", checkRole(["admin"]), deleteTool);
export default router;
