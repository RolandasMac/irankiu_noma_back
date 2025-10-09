// models/Post.js
import mongoose from "mongoose";
import post from "../../../schemas/allSchemas.js";

const postSchema = new mongoose.Schema(post, {
  timestamps: true,
});

const Post = mongoose.model("Post", postSchema);

export default Post;
