import express from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../controllers/taskController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createTask).get(getTasks);
router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);

export default router;
