import ForumPost from "../models/ForumPost.js";
import Comment from "../models/Comment.js";

// 🟢 Create Post (with image)
export const createPost = async (req, res) => {
  try {
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { title, content, tags, privacy, familyId } = req.body;
    const postData = {
      author: req.user._id,
      title,
      content,
      tags: tags ? tags.split(",") : [],
      privacy: privacy || "public",
      familyId: privacy === "family" ? familyId : null,
    };

    if (req.file) {
      postData.image = req.file.path.replace("\\", "/");
    }

    const post = await ForumPost.create(postData);
    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Error creating post", error: error.message });
  }
};


// 📋 Get All Posts (public or family)
export const getPosts = async (req, res) => {
  try {
    const { familyId } = req.query;
    const filter = {
      $or: [{ privacy: "public" }, { familyId }],
    };
    const posts = await ForumPost.find(filter)
      .populate("author", "name email")
      .populate("comments.author", "name email") // <-- populate comment authors
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error: error.message });
  }
};


// ❤️ Like / Unlike Post
export const toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();

    res.status(200).json({
      message: isLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error liking post", error: error.message });
  }
};

// 🗑️ Delete Post (only author)
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own post" });
    }

    await Comment.deleteMany({ postId });
    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error: error.message });
  }
};

// 💬 Add Comment
// 💬 Add Comment
export const addComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!content || !postId) {
      return res.status(400).json({ message: "Post ID and content are required" });
    }

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      author: req.user._id,
      content,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // Populate author of the newly added comment
    const newComment = post.comments[post.comments.length - 1];
    await post.populate({
      path: "comments.author",
      select: "name email",
    });

    res.status(201).json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment", error: error.message });
  }
};

// 🧾 Get Comments for a Post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId })
      .populate("author", "name email")
      .sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error: error.message });
  }
};
//Update the post
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own post" });
    }

    // Update title and content
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;

    // Update image if uploaded
    if (req.file) {
      post.image = req.file.path.replace("\\", "/");
    }

    await post.save();
    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ message: "Error updating post", error: error.message });
  }
};
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id; // ID of the user trying to delete

        // 1. Find the Post containing the specific comment ID
        const post = await ForumPost.findOne({ "comments._id": commentId });

        if (!post) {
            return res.status(404).json({ message: "Post containing comment not found." });
        }

        // 2. Find the comment subdocument within the post's comments array
        const comment = post.comments.id(commentId);

        if (!comment) {
            // This should ideally not happen if step 1 was successful, but included for robustness
            return res.status(404).json({ message: "Comment not found." });
        }

        // 3. Authorization Check: Ensure the logged-in user is the comment author
        // Convert IDs to string for comparison
        if (comment.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this comment." });
        }

        // 4. Remove the comment subdocument and save the parent post
        comment.deleteOne(); // Use Mongoose subdocument deletion method
        await post.save();

        res.status(200).json({ message: "Comment deleted successfully." });

    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Error deleting comment", error: error.message });
    }
};