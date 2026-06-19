import express from "express";
import { getUsersForSidebar, getMessages, getConversationsForSidebar } from "../controllers/messageController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { sendMessage } from "../controllers/messageController.js";


const router = express.Router();

router.use(protectRoute)

router.get("/users", getUsersForSidebar)
router.get("/conversations", getConversationsForSidebar);
router.get("/:id", getMessages);
router.post("/send/:id", upload.single("media"), sendMessage);
//todo: show this in the frontend

export default router;