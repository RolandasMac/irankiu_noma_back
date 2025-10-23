import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  test
} from "../controllers/ordersController.js";

const router = express.Router();

const orderSchema = Joi.object({
  client_id: Joi.string().required(),
  tool_id: Joi.string().required(),
  date: Joi.date().required(),
  date_until: Joi.date().required(),
  discount: Joi.number().required(),
  pay_sum: Joi.number().required(),
  depozit: Joi.number().required(),
  payment_method: Joi.string().required(),
  paid: Joi.boolean().required(),
  returned: Joi.boolean().required(),
  pay_sum_words: Joi.string(),
  days: Joi.number().required(),
  // docs_urls: Joi.array()
  //   .items(Joi.object().pattern(Joi.string(), Joi.string()))
  //   .required(),
  // paid: Joi.boolean().required(),
  // returned: Joi.boolean().required(),
});

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/", validateBody(orderSchema), createOrder);
router.put("/:id", validateBody(orderSchema), updateOrder);
router.delete("/:id", deleteOrder);
router.post("/test", test)

export default router;
