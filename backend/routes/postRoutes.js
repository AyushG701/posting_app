import express from "express";
import userAuth from "../middleware/authHandler.js";
import {
  createPost,
  getComments,
  getPost,
  getPosts,
} from "../controllers/postController.js";

const router = express.Router();

// crete post
router.post("/create-post", userAuth, createPost);
// get posts
router.post("/", userAuth, getPosts);
router.post("/:id", userAuth, getPost);

router.post("/get-user-post/:id", userAuth, getUserPost);

// get comments
router.get("/comments/:postId", getComments);

//like and comment on posts
router.post("/like/:id", userAuth, likePost);

export default router;
