import Comments from "../models/commentModel.js";
import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";

export const createPost = async (req, res, next) => {
  try {
    // Validate request body
    if (!req.body || !req.body.user || !req.body.user.userId) {
      return res.status(400).json({
        success: false,
        message: "User information is required",
      });
    }
    const { userId } = req.body.user;
    const { description, image } = req.body;

    if (!description) {
      next("You must provide a description");
      return;
    }

    // Validate description
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    // Validate userId format (assuming MongoDB ObjectId)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Validate and sanitize image (if provided)
    if (image && typeof image !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid image format",
      });
    }

    const post = await Posts.create({
      userId,
      description: description.trim(),
      image: image ? image.trim() : null,
    });

    res.status(200).json({
      sucess: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getPosts = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { search } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      // assuming MongoDB ObjectId format
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const friends = user.friends ? user.friends.map(String) : [];
    friends.push(userId);

    const searchPostQuery = search
      ? {
          description: { $regex: search, $options: "i" },
        }
      : {};

    const posts = await Posts.find(search ? searchPostQuery : {})
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    const friendsPosts = posts.filter((post) =>
      friends.includes(post.userId._id.toString()),
    );

    const otherPosts = posts.filter(
      (post) => !friends.includes(post.userId._id.toString()),
    );

    const postsRes = search ? friendsPosts : [...friendsPosts, ...otherPosts];

    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: postsRes,
    });
  } catch (error) {
    console.error(error);
    next(error); // Pass the error to the error handling middleware
  }
};

export const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.findById(id).populate({
      path: "userId",
      select: "firstName lastName location profileUrl -password",
    });
    // .populate({
    //   path: "comments",
    //   populate: {
    //     path: "userId",
    //     select: "firstName lastName location profileUrl -password",
    //   },
    //   options: {
    //     sort: "-_id",
    //   },
    // })
    // .populate({
    //   path: "comments",
    //   populate: {
    //     path: "replies.userId",
    //     select: "firstName lastName location profileUrl -password",
    //   },
    // });

    res.status(200).json({
      sucess: true,
      message: "successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
