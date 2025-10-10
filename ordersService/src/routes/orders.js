import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/ordersController.js";

const router = express.Router();

const orderSchema = Joi.object({
  client_id: Joi.string().required(),
  tool_id: Joi.string().required(),
  date: Joi.date().required(),
  // time: Joi.date().required(),
  discount: Joi.number().required(),
  docs_urls: Joi.array()
    .items(Joi.object().pattern(Joi.string(), Joi.string()))
    .required(),
  pay_sum: Joi.number().required(),
  paid: Joi.boolean().required(),
  date_until: Joi.date().required(),
  returned: Joi.boolean().required(),
});

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/", validateBody(orderSchema), createOrder);
router.put("/:id", validateBody(orderSchema), updateOrder);
router.delete("/:id", deleteOrder);

export default router;
