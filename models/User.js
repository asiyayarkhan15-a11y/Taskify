const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name is too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    // Present for email/password users; absent for Google-only users.
    passwordHash: {
      type: String,
    },
    // Present for Google users.
    googleId: {
      type: String,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash a plain password and store it.
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

// Compare a plain password against the stored hash.
userSchema.methods.checkPassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

// Safe representation to send to the client (never the hash).
userSchema.methods.toPublic = function () {
  return { id: this._id, name: this.name, email: this.email, avatar: this.avatar };
};

module.exports = mongoose.model("User", userSchema);
