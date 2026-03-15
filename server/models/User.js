// server/models/User.js

const mongoose = require("mongoose");

// A Schema defines the structure and rules for documents in a collection.
// Every field has a type, and can have validation rules.
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"], // [rule, error message]
      unique: true, // no two users with same username
      trim: true, // removes accidental spaces
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // automatically converts to lowercase before saving
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    totalScore: {
      type: Number,
      default: 0, // every new user starts with 0
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: "", // url to profile picture, empty for now
    },
  },
  {
    // timestamps: true automatically adds TWO fields to every document:
    // createdAt — when the document was first created
    // updatedAt — whenever the document is modified
    // You never have to set these manually.
    timestamps: true,
  },
);

// mongoose.model() creates a "Model" class from your schema.
// First argument: the name ('User') — Mongoose will look for a collection
// called 'users' (lowercase plural of 'User') in MongoDB automatically.
// Second argument: the schema to use.
module.exports = mongoose.model("User", userSchema);
