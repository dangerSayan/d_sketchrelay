// server/config/db.js

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // mongoose.connect() returns a Promise, so we await it
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // conn.connection.host tells you which server you connected to
    // useful for confirming you're hitting the right DB in logs
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // process.exit(1) forcefully stops Node with a "failure" code
    // We do this because without a DB, the app is completely broken
    process.exit(1);
  }
};

// We export the function itself, not its result
// The caller will do: const connectDB = require('./config/db'); connectDB();
module.exports = connectDB;
