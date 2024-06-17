import mongoose from "mongoose";
import Verification from "../models/emailVerification.js";
import { compareString } from "../utils/index.js";
import Users from "../models/userModel.js";
import PasswordReset from "../models/PasswordReset.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
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
