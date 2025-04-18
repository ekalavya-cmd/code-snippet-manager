const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  tags: [String],
  category: { type: String, default: "Other" },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    validate: {
      validator: function (value) {
        return value != null; // Ensure createdBy is not null or undefined
      },
      message: "createdBy cannot be null or undefined",
    },
  },
  verified: { type: Boolean, default: false },
});

module.exports = mongoose.model("Snippet", snippetSchema);
