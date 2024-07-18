import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import {
  selectUser,
  insertData,
  updateUser,
  deleteImageById,
} from "../../../models/IICSAA/userPhoto";
import { UploadedFile } from "express-fileupload";

export const getUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId; // Correct the parameter name to userId
      const userPhoto = await selectUser(userId);

      // Assuming userPhoto is retrieved as Base64 encoded string
      res.status(200).json({ status: true, data: { userPhoto } });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      next({ status: 500, message: "Internal server error" });
    }
  }
);

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Received form-data:", req.body.userId, req.files);

    const { userId } = req.body;
    const userPhoto = req.files?.userPhoto as UploadedFile;

    console.log("Extracted userId:", userId);
    console.log("Extracted userPhoto:", userPhoto);

    if (!userId) {
      throw new Error("IICSAAL_USER_ID is required");
    }

    if (!userPhoto) {
      throw new Error("userPhoto is required");
    }

    // Access userPhoto data
    const userPhotoBuffer = userPhoto.data; // This is a Buffer containing file data

    // Assuming you want to store the image data as Base64 in the database
    const userPhotoBase64 = userPhotoBuffer.toString("base64");

    const result = await insertData({
      IICSAAL_USER_ID: userId,
      IICSAAL_USER_Photo: userPhotoBase64, // Store as Base64 string or handle as needed
    });

    console.log("Insertion result:", result);

    // Respond with the result of insertion
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    next({ status: 400, message: error.message });
  }
};

export const updateUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    console.log("Received userId:", userId); // Log userId for debugging

    const userPhoto = req.files?.userPhoto as UploadedFile;
    console.log("Extracted userId:", userId);
    console.log("Extracted userPhoto:", userPhoto);

    if (!userId) {
      throw new Error("IICSAAL_USER_ID is required");
    }

    if (!userPhoto) {
      throw new Error("userPhoto is required");
    }

    // Convert userPhoto to Base64 string
    const userPhotoBase64 = userPhoto.data.toString("base64");

    // Call updateUser with the correct parameters
    const result = await updateUser({
      IICSAAL_USER_ID: userId,
      IICSAAL_USER_Photo: userPhotoBase64,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    next({ status: 400, message: error.message });
  }
};

export const deleteImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.query.userId as string;
    console.log("Deleting image for userId:", userId);

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "userId is required",
      });
    }

    const result = await deleteImageById(userId);

    if (result.recordsAffected === 0) {
      return res.status(404).json({
        status: false,
        message: `User with ID ${userId} not found or no image associated.`,
      });
    }

    res.status(200).json({
      status: true,
      message: `Image deleted successfully for user with ID: ${userId}`,
      recordsAffected: result.recordsAffected,
    });
  } catch (error: any) {
    console.error("Error deleting image:", error);
    next({ status: 500, message: "Internal server error" });
  }
};
