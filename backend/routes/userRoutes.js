import express from "express";
import * as userController from "../controller/userController.js";

const router = express.Router();

// ------------------- Routes -------------------
router.post("/", userController.createUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);

router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);


export default router;
