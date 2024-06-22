import express from "express";
import userAuth from "../middleware/authHandler.js";
import { createPost, getPosts } from "../controllers/postController.js";

const router = express.Router();

// crete post
router.post("/create-post", userAuth, createPost);
// get posts
router.post("/", userAuth, getPosts);
export default router;
