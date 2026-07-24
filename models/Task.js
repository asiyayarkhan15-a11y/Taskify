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
    // Due date (also used by the calendar to place the task on a day).
    date: {
      type: Date,
      default: Date.now,
    },
    // High / medium / low, shown as a colored tag and used for sorting.
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    // Free-text group like "Work", "Study", "Personal".
    category: {
      type: String,
      trim: true,
      maxlength: [40, "Category is too long"],
      default: "",
    },
    // Optional longer description.
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes are too long"],
      default: "",
    },
    // Checklist of smaller steps.
    subtasks: [
      {
        text: { type: String, trim: true, maxlength: 200 },
        done: { type: Boolean, default: false },
      },
    ],
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
