import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import {
  listDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getDiscountsByToolId,
} from "../controllers/discountsController.js";
import { checkRole } from "../middleware/checkRole.js";
const router = express.Router();

const discountSchema = Joi.object({
  tools_id: Joi.array().items(Joi.string()).required(),
  min_days: Joi.number().required(),
  max_days: Joi.number().required(),
  discount: Joi.number().required(),
  valid_from: Joi.date().required(),
  valid_until: Joi.date().required(),
});

router.get("/", checkRole(["admin", "manager"]), listDiscounts);
router.get("/:id", checkRole(["admin", "manager"]), getDiscount);
router.post(
  "/",
  checkRole(["admin"]),
  validateBody(discountSchema),
  createDiscount
);
router.put(
  "/:id",
  checkRole(["admin"]),
  validateBody(discountSchema),
  updateDiscount
);
router.delete("/:id", checkRole(["admin"]), deleteDiscount);
router.get(
  "/toolId/:toolId",
  checkRole(["admin", "manager"]),
  getDiscountsByToolId
);

export default router;
