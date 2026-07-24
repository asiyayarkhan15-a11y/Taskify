const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Task text is required"],
      trim: true,
      maxlength: [200, "Task text cannot exceed 200 characters"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    // The day this task is scheduled for. Defaults to now so tasks added
    // from the main list land on today; the calendar can set a specific day.
    date: {
      type: Date,
      default: Date.now,
    },
    // The user who owns this task.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    // Adds createdAt and updatedAt automatically.
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
