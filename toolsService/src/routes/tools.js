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

const router = express.Router();

const toolSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().trim().min(1).required(),
  description: Joi.array().items(Joi.string().trim().min(1)).required(),
  price: Joi.number().required(),
  depozit: Joi.number().required(),
  rented: Joi.boolean().default(false),
  rented_until: Joi.date().optional(),
});

router.get("/", listTools);
router.get("/:id", getTool);
router.post("/", validateBody(toolSchema), createTool);
router.put("/:id", validateBody(toolSchema), updateTool);
router.delete("/:id", deleteTool);

export default router;
