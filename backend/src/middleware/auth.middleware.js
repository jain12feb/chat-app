import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { sendErrorResponse } from "../lib/api-response.js";

// Middleware to check if the user is authenticated
export const isAuthenticated = async (req, res, next) => {
  try {
    // Get the token from cookies
    const token = req.cookies.jwt;

    // Check if token is not present
    if (!token) {
      return sendErrorResponse(
        res,
        new Error("Unauthorized - No Token Provided"),
        401
      );
    }

    // Verify the token using JWT_SECRET_KEY
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Check if the decoded token is valid
    if (!decoded || decoded.userId !== decoded.sub) {
      return sendErrorResponse(
        res,
        new Error("Unauthorized - Invalid Token"),
        401
      );
    }

    // Fetch the user based on decoded userId
    const user = await User.findById(decoded.userId).select("-password");

    // If user does not exist, send a 404 response
    if (!user) {
      return sendErrorResponse(res, new Error("User not found"), 404);
    }

    // Attach user data to the request object
    req.user = user;

    // Call the next middleware/route handler
    next();
  } catch (error) {
    // Log the error and send a generic error message
    console.error("Error in isAuthenticated middleware:", error.message);
    sendErrorResponse(res, new Error("Internal server error"), 500);
  }
};
