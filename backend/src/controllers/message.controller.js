import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { sendErrorResponse, sendSuccessResponse } from "../lib/api-response.js"; // Utility functions

// Get all users (excluding logged-in user)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password -__v"
    );
    sendSuccessResponse(res, users);
  } catch (error) {
    console.error("Error in getAllUsers: ", error.message);
    sendErrorResponse(res, new Error("Failed to fetch all users"), 500);
  }
};

// Get users for sidebar (excluding logged-in user)
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );
    sendSuccessResponse(res, users);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    sendErrorResponse(res, new Error("Failed to fetch users for sidebar"), 500);
  }
};

// Get messages between logged-in user and specific user
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);

    sendSuccessResponse(res, messages);
  } catch (error) {
    console.error("Error in getMessages controller: ", error.message);
    sendErrorResponse(res, new Error("Failed to fetch messages"), 500);
  }
};

// Send a message (text, image, or document) to a specific user
export const sendMessage = async (req, res) => {
  try {
    const { text, image, document } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (receiverId === senderId) {
      return sendSuccessResponse(
        res,
        { message: "You can't send a message to yourself" },
        400
      );
    }

    let imageUrl = null;
    let documentUrl = null;

    // Handle image upload if provided
    if (image) {
      // Validate image format (optional but recommended)
      if (!/^data:image\/(jpeg|png|jpg);base64,/.test(image)) {
        return sendErrorResponse(res, new Error("Invalid image format"), 400);
      }

      // Upload image to Cloudinary and get the secure URL
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Handle document upload if provided
    // Handle document upload if provided
    if (document) {
      // Validate document format (more lenient check for document types)
      if (
        !/^data:application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet);base64,/.test(
          document
        )
      ) {
        return sendErrorResponse(
          res,
          new Error("Invalid document format"),
          400
        ); // Send error with 400 status code
      }

      // Upload document to Cloudinary and get the secure URL
      const uploadResponse = await cloudinary.uploader.upload(document, {
        resource_type: "raw", // Cloudinary handles automatic file type detection
        format: "pdf",
      });
      console.log("uploadResponse", uploadResponse);
      documentUrl = uploadResponse.secure_url;
    }

    // Create a new message document
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      document: documentUrl, // Store the document URL if available
    });

    // Save the new message to the database
    await newMessage.save();

    // Check if the receiver is online and send the message via socket if they are
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Send success response with the new message
    sendSuccessResponse(res, newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller: ", error.message);
    sendErrorResponse(res, new Error("Failed to send message"), 500);
  }
};
