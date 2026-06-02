import { Router } from "express";
import { create, getAll, update, remove } from "../controllers/salaryController.js";
const router = Router();
router.post("/", create);
router.get("/", getAll);
router.put("/:id", update);
router.delete("/:id", remove);
export default router;