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

export const getUserPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.find({ userId: id })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

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

export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const postComments = await Comments.find({ postId })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .populate({
        path: "replies.userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "successfully",
      data: postComments,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const likePost = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;

    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }
    const post = await Posts.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    // Check if the user has already liked the post
    const hasLiked = post.likes.includes(String(userId));

    // Update likes array
    const updatedLikes = hasLiked
      ? post.likes.filter((pid) => pid !== String(userId))
      : [...post.likes, userId];

    const updatedPost = await Posts.findByIdAndUpdate(
      id,
      { likes: updatedLikes },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: hasLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      data: updatedPost,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const likePostComment = async (req, res, next) => {
  const { userId } = req.body.user;
  const { id, rid } = req.params;

  try {
    if (rid === undefined || rid === null || rid === `false`) {
      const comment = await Comments.findById(id);

      const index = comment.likes.findIndex((el) => el === String(userId));

      if (index === -1) {
        comment.likes.push(userId);
      } else {
        comment.likes = comment.likes.filter((i) => i !== String(userId));
      }

      const updated = await Comments.findByIdAndUpdate(id, comment, {
        new: true,
      });

      res.status(201).json(updated);
    } else {
      const replyComments = await Comments.findOne(
        { _id: id },
        {
          replies: {
            $elemMatch: {
              _id: rid,
            },
          },
        },
      );

      const index = replyComments?.replies[0]?.likes.findIndex(
        (i) => i === String(userId),
      );

      if (index === -1) {
        replyComments.replies[0].likes.push(userId);
      } else {
        replyComments.replies[0].likes = replyComments.replies[0]?.likes.filter(
          (i) => i !== String(userId),
        );
      }

      const query = { _id: id, "replies._id": rid };

      const updated = {
        $set: {
          "replies.$.likes": replyComments.replies[0].likes,
        },
      };

      const result = await Comments.updateOne(query, updated, { new: true });

      res.status(201).json(result);
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const commentPost = async (req, res, next) => {
  try {
    const { comment, from } = req.body;
    const { userId } = req.body.user;
    const { id } = req.params;

    if (comment === null) {
      return res.status(404).json({ message: "Comment is required." });
    }

    const newComment = new Comments({ comment, from, userId, postId: id });

    await newComment.save();

    //updating the post with the comments id
    const post = await Posts.findById(id);

    post.comments.push(newComment._id);

    const updatedPost = await Posts.findByIdAndUpdate(id, post, {
      new: true,
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
