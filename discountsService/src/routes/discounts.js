import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import {
  listDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discountsController.js";

const router = express.Router();

const discountSchema = Joi.object({
  tols_id: Joi.array().items(Joi.string()).required(),
  min_days: Joi.number().required(),
  max_days: Joi.number().required(),
  discount: Joi.number().required(),
  valid_from: Joi.date().required(),
  valid_until: Joi.date().required(),
});

router.get("/", listDiscounts);
router.get("/:id", getDiscount);
router.post("/", validateBody(discountSchema), createDiscount);
router.put("/:id", validateBody(discountSchema), updateDiscount);
router.delete("/:id", deleteDiscount);

export default router;
