import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  test,
} from "../controllers/ordersController.js";
import { checkRole } from "../middleware/checkRole.js";
const router = express.Router();

const orderSchema = Joi.object({
  client_id: Joi.string().required(),
  clientName: Joi.string().required(),
  tool_id: Joi.string().required(),
  toolName: Joi.string().required(),
  date: Joi.date().required(),
  date_until: Joi.date().required(),
  discount: Joi.number().required(),
  pay_sum: Joi.number().required(),
  depozit: Joi.number().required(),
  payment_method: Joi.string().required(),
  paid: Joi.boolean().required(),
  returned: Joi.boolean().required(),
  // pay_sum_words: Joi.string(),
  days: Joi.number().required(),
  lang: Joi.string().required(),
  docNr: Joi.string().optional(),
  // docs_urls: Joi.array()
  //   .items(Joi.object().pattern(Joi.string(), Joi.string()))
  //   .required(),
  // paid: Joi.boolean().required(),
  // returned: Joi.boolean().required(),
});

router.get("/", checkRole(["admin", "manager"]), listOrders);
router.get("/:id", checkRole(["admin", "manager"]), getOrder);
router.post(
  "/",
  checkRole(["admin", "manager"]),
  validateBody(orderSchema),
  createOrder
);
router.put(
  "/:id",
  // checkRole(["admin", "manager"]),
  // validateBody(orderSchema),
  updateOrder
);
router.delete("/:id", checkRole(["admin"]), deleteOrder);
router.post("/test", checkRole(["admin", "manager"]), test);

export default router;
