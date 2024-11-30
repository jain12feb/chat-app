import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import generateToken from "../lib/jwt-token.js";
import { sendErrorResponse, sendSuccessResponse } from "../lib/api-response.js";

// Regular expression for validating email format
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Validate if all required fields are provided
    if (!fullName || !email || !password) {
      return sendErrorResponse(res, new Error("All fields are required"), 400);
    }

    // Validate email format with regex
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, new Error("Invalid email format"), 400);
    }

    // Validate password length
    if (password.length < 6) {
      return sendErrorResponse(
        res,
        new Error("Password must be at least 6 characters"),
        400
      );
    }

    // Check if the user already exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, new Error("Email already exists"), 400);
    }

    // Create new user instance
    const newUser = new User({
      fullName,
      email,
      password, // The password will be hashed automatically due to the pre-save hook
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Generate JWT token after successful registration
    generateToken(savedUser._id, res);

    // Return the response with user details (password is already excluded by the model)
    sendSuccessResponse(res, savedUser, 201);
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return sendErrorResponse(res, new Error("Invalid credentials"), 400);
    }

    // Use the instance method matchPassword to check the password
    const isPasswordCorrect = await user.matchPassword(password); // Use the matchPassword method here
    if (!isPasswordCorrect) {
      return sendErrorResponse(res, new Error("Invalid credentials"), 400);
    }

    // Generate JWT token
    generateToken(user._id, res);

    // Return the response with user details (password is automatically excluded by the model)
    sendSuccessResponse(res, user, 200);
  } catch (error) {
    console.log("Error in login controller", error.message);
    sendErrorResponse(res, error, 500);
  }
};

export const logout = (req, res) => {
  try {
    // Clear the JWT cookie to log the user out
    res.cookie("jwt", "", { maxAge: 0 });
    sendSuccessResponse(res, { message: "Logged out successfully" });
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    // Validate that profilePic is provided
    if (!profilePic) {
      return sendErrorResponse(res, new Error("Profile pic is required"), 400);
    }

    // Upload profile picture to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePic, {
      folder: "ChatApp",
      public_id: userId,
    });

    console.log("uploadResponse", uploadResponse);

    // Update user's profile with the new profile pic URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    sendSuccessResponse(res, updatedUser);
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

export const checkAuth = (req, res) => {
  try {
    sendSuccessResponse(res, req.user);
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user's ID from the authenticated user (middleware)

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return sendErrorResponse(res, new Error("User not found"), 404);
    }

    // Delete the user's profile picture from Cloudinary (if exists)
    if (user.profilePic) {
      const publicId = userId.toString(); // Assuming publicId matches the user ID
      await cloudinary.uploader.destroy(`ChatApp/${publicId}`); // Delete the image from Cloudinary
    }

    // Delete the user from the database
    await User.findByIdAndDelete(userId);

    // Clear the JWT cookie to log the user out
    res.cookie("jwt", "", { maxAge: 0 });

    // Send success response
    sendSuccessResponse(res, { message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProfile controller: ", error.message);
    sendErrorResponse(res, error, 500, "Failed to delete profile");
  }
};
