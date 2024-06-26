import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";
import { compareString } from "../utils/index.js";
import Users from "../models/userModel.js";
import PasswordReset from "../models/PasswordReset.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import { FriendRequest } from "../models/friendRequestModel.js";
// export const verifyEmail = async (req, res) => {
//   const { userId, token } = req.params;

//   try {
//     const result = await Verification.findOne({ userId });

//     if (result) {
//       const { expiresAt, token: hashedToken } = result;

//       // token has expires
//       if (expiresAt < Date.now()) {
//         Verification.findOneAndDelete({ userId })
//           .then(() => {
//             Users.findOneAndDelete({ _id: userId })
//               .then(() => {
//                 const message = "Verification token has expired.";
//                 res.redirect(`/users/verified?status=error&message=${message}`);
//               })
//               .catch((err) => {
//                 res.redirect(`/users/verified?status=error&message=`);
//               });
//           })
//           .catch((error) => {
//             console.log(error);
//             res.redirect(`/users/verified?message=`);
//           });
//       } else {
//         //token valid
//         compareString(token, hashedToken)
//           .then((isMatch) => {
//             if (isMatch) {
//               Users.findOneAndUpdate({ _id: userId }, { verified: true })
//                 .then(() => {
//                   Verification.findOneAndDelete({ userId }).then(() => {
//                     const message = "Email verified successfully";
//                     res.redirect(
//                       `/users/verified?status=success&message=${message}`,
//                     );
//                   });
//                 })
//                 .catch((err) => {
//                   console.log(err);
//                   const message = "Verification failed or link is invalid";
//                   res.redirect(
//                     `/users/verified?status=error&message=${message}`,
//                   );
//                 });
//             } else {
//               // invalid token
//               const message = "Verification failed or link is invalid";
//               res.redirect(`/users/verified?status=error&message=${message}`);
//             }
//           })
//           .catch((err) => {
//             console.log(err);
//             res.redirect(`/users/verified?message=`);
//           });
//       }
//     } else {
//       const message = "Invalid verification link. Try again later.";
//       res.redirect(`/users/verified?status=error&message=${message}`);
//     }
//   } catch (error) {
//     console.log(err);
//     res.redirect(`/users/verified?message=`);
//   }
// };

export const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const verification = await Verification.findOne({ userId });
    if (!verification) {
      return redirectWithMessage(
        res,
        "error",
        "Invalid verification link. Try again later.",
      );
    }

    const { expiresAt, token: hashedToken } = verification;

    // Check if the token has expired
    if (expiresAt < Date.now()) {
      await Verification.findOneAndDelete({ userId });
      await Users.findOneAndDelete({ _id: userId });
      return redirectWithMessage(
        res,
        "error",
        "Verification token has expired.",
      );
    }

    // Compare provided token with stored hashed token
    const isMatch = await compareString(token, hashedToken);
    if (!isMatch) {
      return redirectWithMessage(
        res,
        "error",
        "Verification failed or link is invalid",
      );
    }

    // Mark user as verified
    await Users.findOneAndUpdate({ _id: userId }, { verified: true });
    await Verification.findOneAndDelete({ userId });

    redirectWithMessage(res, "success", "Email verified successfully");
  } catch (error) {
    console.error(error);
    redirectWithMessage(
      res,
      "error",
      "Something went wrong. Please try again.",
    );
  }
};

// Helper function to handle redirects with status and message
const redirectWithMessage = (res, status, message) => {
  res.redirect(
    `/users/verified?status=${status}&message=${encodeURIComponent(message)}`,
  );
};

// requestPasswordReset

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "Email address not found",
      });
    }
    const existingRequest = await PasswordReset.findOne({ email });
    if (existingRequest) {
      if (existingRequest.expiresAt > Date.now()) {
        return res.status(201).json({
          status: "PENDING",
          message:
            "Password reset request already sent. Please check your email.",
        });
      }
      await PasswordReset.findOneAndDelete({ email });
    }
    await resetPasswordLink(user, res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  try {
    // find record
    const user = await Users.findById(userId);

    if (!user) {
      const message = "Invalid password reset link. Try again";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    }

    const resetPassword = await PasswordReset.findOne({ userId });

    if (!resetPassword) {
      const message = "Invalid password reset link. Try again";
      return res.redirect(
        `/users/resetpassword?status=error&message=${message}`,
      );
    }

    const { expiresAt, token: resetToken } = resetPassword;

    if (expiresAt < Date.now()) {
      const message = "Reset Password link has expired. Please try again";
      res.redirect(`/users/resetpassword?status=error&message=${message}`);
    } else {
      const isMatch = await compareString(token, resetToken);

      if (!isMatch) {
        const message = "Invalid reset password link. Please try again";
        res.redirect(`/users/resetpassword?status=error&message=${message}`);
      } else {
        res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { userId, password } = req.body;

    const hashedpassword = await hashString(password);

    const user = await Users.findByIdAndUpdate(
      { _id: userId },
      { password: hashedpassword },
    );

    if (user) {
      await PasswordReset.findOneAndDelete({ userId });

      res.status(200).json({
        ok: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

// Function to fetch user details by userId or id
export const getUser = async (req, res, next) => {
  try {
    // Destructure userId from req.body.user and id from req.params
    const { userId } = req.body.user;
    const { id } = req.params;

    // Find user by id (if id is provided) or userId (fallback to userId if id is not provided)
    const user = await Users.findById(id ?? userId).populate({
      path: "friends", // Populate the 'friends' field of the user object
      select: "-password", // Exclude the 'password' field from the 'friends' data
    });

    // If user is not found, send a response indicating 'User Not Found'
    if (!user) {
      return res.status(200).send({
        message: "User Not Found",
        success: false,
      });
    }

    // Remove the 'password' field from the user object for security reasons
    user.password = undefined;

    // Send a success response with the user object (excluding password)
    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.log(error);
    res.status(500).json({
      message: "auth error", // Error message indicating authentication error
      success: false,
      error: error.message, // Detailed error message
    });
  }
};

// Function to update user information
export const updateUser = async (req, res, next) => {
  try {
    // Destructure fields from req.body
    const { firstName, lastName, location, profileUrl, profession } = req.body;

    // Check if at least one of the required fields is provided
    if (!(firstName || lastName || location || profileUrl || profession)) {
      next("Please provide at least one field to update");
      return;
    }

    // Extract userId from req.body.user
    const { userId } = req.body.user;

    // Prepare object with fields to update
    const updateUser = {
      firstName,
      lastName,
      location,
      profileUrl,
      profession,
    };

    // Find user by userId and update information, returning the updated user (new: true)
    const user = await Users.findByIdAndUpdate(userId, updateUser, {
      new: true,
    });

    // Populate the 'friends' field of the updated user, excluding 'password' field
    // await user
    //   .populate({ path: "friends", select: "-password" })
    //   .execPopulate();

    // Create a new JWT token for the updated user
    const token = createJWT(user?._id);

    // Remove 'password' field from user object for security
    user.password = undefined;

    // Send a success response with updated user details, message, and token
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
      token,
    });
  } catch (error) {
    // Handle errors and send error response
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const friendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body.user;

    const { requestTo } = req.body;

    const requestExist = await FriendRequest.findOne({
      requestFrom: userId,
      requestTo,
    });

    if (requestExist) {
      next("Friend Request already sent.");
      return;
    }

    const accountExist = await FriendRequest.findOne({
      requestFrom: requestTo,
      requestTo: userId,
    });

    if (accountExist) {
      next("Friend Request already sent.");
      return;
    }

    const newRes = await FriendRequest.create({
      requestTo,
      requestFrom: userId,
    });

    res.status(201).json({
      success: true,
      message: "Friend Request sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const getFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body.user;

    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "Pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({
        _id: -1,
      });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const acceptFriendRequest = async (req, res, next) => {
  try {
    const id = req.body.user.userId;

    const { rid, status } = req.body;

    const requestExist = await FriendRequest.findById(rid);

    if (!requestExist) {
      next("No Friend Request Found.");
      return;
    }

    const newRes = await FriendRequest.findByIdAndUpdate(
      { _id: rid },
      { requestStatus: status },
    );

    if (status === "Accepted") {
      const user = await Users.findById(id);

      user.friends.push(newRes?.requestFrom);

      await user.save();

      const friend = await Users.findById(newRes?.requestFrom);

      friend.friends.push(newRes?.requestTo);

      await friend.save();
    }

    res.status(201).json({
      success: true,
      message: "Friend Request " + status,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

//view profile c
export const profileViews = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.body;

    // Fetch the user profile
    const user = await Users.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check for duplicate view
    if (!user.views.includes(userId)) {
      user.views.push(userId);
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: "Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "auth error",
      success: false,
      error: error.message,
    });
  }
};

export const suggestedFriends = async (req, res) => {
  try {
    if (!req.body || !req.body.user || !req.body.user.userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required user information",
      });
    }

    const { userId } = req.body.user;

    // Ensure userId is a valid ObjectId (assuming MongoDB)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    let queryObject = {
      _id: { $ne: userId },
      friends: { $nin: userId },
    };

    // Default values for pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const queryResult = Users.find(queryObject)
      .skip(skip)
      .limit(limit)
      .select("firstName lastName profileUrl profession -password");

    const suggestedFriends = await queryResult;

    res.status(200).json({
      success: true,
      message: `${suggestedFriends.length} suggested friends found`,
      data: suggestedFriends,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
