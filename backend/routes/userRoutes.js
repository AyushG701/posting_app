import express from "express";
import path from "path";
import {
  acceptFriendRequest,
  changePassword,
  friendRequest,
  getFriendRequest,
  getUser,
  requestPasswordReset,
  resetPassword,
  updateUser,
  verifyEmail,
  suggestedFriends,
  profileViews,
} from "../controllers/userController.js";
// import { resetPasswordLink } from "../utils/sendEmail.js";
import userAuth from "../middleware/authHandler.js";

const router = express.Router();
const __dirname = path.resolve(path.dirname(""));

router.get("/verify/:userId/:token", verifyEmail);

// Password Reset
router.get("/reset-password/:userId/:token", requestPasswordReset);
router.post("/request-password-reset", resetPassword);
router.post("/reset-password", changePassword);

// user routes
router.post("/get-user/:id?", userAuth, getUser);
router.put("/update-user", userAuth, updateUser);
// friend request route
router.post("/friend-request", userAuth, friendRequest);
router.post("get-friend-request", userAuth, getFriendRequest);

// accept / deny friend request
router.post("/accept-friend-request", userAuth, acceptFriendRequest);

//view profile
router.post("/profile-view", userAuth, profileViews);

//suggested friends
router.post("/suggested-friends", userAuth, suggestedFriends);

router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/build/verifiedpage.html"));
});

router.get("/resetpassword", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/build/verifiedpage.html"));
});

export default router;
