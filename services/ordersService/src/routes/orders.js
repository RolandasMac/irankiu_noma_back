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
  cancelOrder,
} from "../controllers/ordersController.js";
import { checkRole } from "../middleware/checkRole.js";
import { deleteOldDocs } from "../middleware/deleteOldDocs.js";
import { testMiddleware } from "../middleware/testMiddleware.js";

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
  payment_method: Joi.object({
    label: Joi.string().required(),
    value: Joi.string().required(),
  }).required(),
  paid: Joi.boolean().required(),
  returned: Joi.boolean().required(),
  days: Joi.number().required(),
  lang: Joi.string().required(),
  docNr: Joi.object({
    contractNr: Joi.string().allow("").optional(),
    invoiceNr: Joi.string().allow("").optional(),
    receiptNr: Joi.string().allow("").optional(),
  }).optional(),
  addons_total: Joi.number().required(),
  addons: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().max(100).required(),
        price: Joi.number().precision(2).min(0).max(1000).required(),
        id: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).max(99).required(),
      })
    )
    .max(20)
    .optional(),
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
  checkRole(["admin", "manager"]),
  validateBody(orderSchema),
  deleteOldDocs,
  updateOrder
);
router.put(
  "/cancel-order/:id",
  checkRole(["admin", "manager"]),
  // validateBody(orderSchema),
  // testMiddleware,
  cancelOrder
);
router.delete("/:id", checkRole(["admin"]), deleteOldDocs, deleteOrder);
router.post("/test", checkRole(["admin", "manager"]), test);

export default router;
