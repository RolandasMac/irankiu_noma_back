import express from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validate.js";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientsController.js";

const router = express.Router();

const clientSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().trim().min(1).required(),
  addres: Joi.string().trim().min(1).required(),
  phone: Joi.string().trim().min(1).required(),
  email: Joi.string().trim().email().required(),
  pvnNr: Joi.string().trim().min(1).optional(),
});

router.get("/", listClients);
router.get("/:id", getClient);
router.post("/", validateBody(clientSchema), createClient);
router.put("/:id", validateBody(clientSchema), updateClient);
router.delete("/:id", deleteClient);

export default router;
