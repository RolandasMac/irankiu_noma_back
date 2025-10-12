import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
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
import paths from "../../../config/paths.js";

const { imageUploadsDir } = paths;
const router = express.Router();
const toolSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().trim().min(1).required(),
  description: Joi.array().items(Joi.string().trim().min(1)).required(),
  images_urls: Joi.array().items(Joi.string().trim().min(1)).required(),
  price: Joi.number().required(),
  depozit: Joi.number().required(),
  rented: Joi.boolean().default(false),
  // rented_until: Joi.date().optional(),
  rented_until: Joi.date()
    .allow(null)
    .default(() => new Date()),
});
// -----Multer-----
// if (!fs.existsSync(imageUploadsDir)) {
//   try {
//     fs.mkdirSync(imageUploadsDir, { recursive: true }); // recursive: true užtikrina, kad bus sukurti visi trūkstami katalogai
//     console.log(`[Doc Service] Sukurtas įkėlimų katalogas: ${imageUploadsDir}`);
//   } catch (mkdirErr) {
//     console.error(
//       `[Doc Service] Klaida kuriant įkėlimų katalogą '${imageUploadsDir}':`,
//       mkdirErr
//     );
//     return cb(
//       new Error(`Serverio klaida: nepavyko sukurti įkėlimų katalogo.`),
//       null
//     );
//     // throw new Error("Serverio klaida: nepavyko sukurti įkėlimų katalogo.");
//   }
// }
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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imageUploadsDir);
  },
  filename: function (req, file, cb) {
    // Suteikiame failui unikalų pavadinimą, kad būtų išvengta konfliktų.
    // Pvz., 'failoPavadinimas-1678888888888.jpg'
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
// Sukuriame Multer instanciją su konfigūracija
// 'upload' dabar yra middleware, kurį naudosime maršrutuose
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limitas
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|png|jpg|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    console.log(
      `[Image Service] File Filter: failo MIME tipas - ${
        file.mimetype
      }, plėtinys - ${path.extname(file.originalname)}`
    );

    if (mimetype && extname) {
      console.log("[Image Service] File Filter: Failas leistino tipo.");
      cb(null, true);
    } else {
      console.warn("[Image Service] File Filter: Failas neleistino tipo.");
      cb(
        new Error("Leidžiami tik paveikslėliai (jpeg, jpg, png, gif)!"),
        false
      );
    }
  },
});

// -----------------

router.get("/", listTools);
router.get("/:id", getTool);
router.post("/", upload.array("images"), createTool); // reikia prideti ištrinta validate middleware
router.post("/:id", validateBody(toolSchema), updateTool);
router.delete("/:id", deleteTool);

export default router;
