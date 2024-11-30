import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false, // Disable __v field globally
  }
);

// Pre-save hook to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash password if it's modified
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Customize `toJSON` and `toObject` to exclude password and __v fields
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password; // Remove password field
    return ret;
  },
});

userSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.password; // Remove password field
    return ret;
  },
});

// Create and export the User model
const User = mongoose.model("User", userSchema);
export default User;
