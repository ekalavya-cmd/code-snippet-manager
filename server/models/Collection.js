const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  snippetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Snippet",
    required: true,
  },
  addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Collection", collectionSchema);
