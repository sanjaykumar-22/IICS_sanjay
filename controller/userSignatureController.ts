import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import {
  insertUserSignature,
  updateUserSignature,
} from "../../../models/IICSAA/userSignature";
import { UploadedFile } from "express-fileupload";

// Create user signature
export const createSignature = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    const userSignatureFile = req.files?.userSignature as UploadedFile;

    if (!userId) {
      throw new Error("IICSAAM_USER_ID is required");
    }

    if (!userSignatureFile) {
      throw new Error("userSignature file is required");
    }

    const userSignatureBuffer = userSignatureFile.data;
    const userSignatureBase64 = userSignatureBuffer.toString("base64");

    const result = await insertUserSignature({
      IICSAAM_USER_ID: userId,
      IICSAAM_USER_SIGN: userSignatureBase64,
    });

    res.status(201).json({ success: true, data: result });
  }
);

// Update user signature
export const updateSignature = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    const userSignatureFile = req.files?.userSignature as UploadedFile;

    if (!userId) {
      throw new Error("IICSAAM_USER_ID is required");
    }

    if (!userSignatureFile) {
      throw new Error("userSignature file is required");
    }

    const userSignatureBuffer = userSignatureFile.data;
    const userSignatureBase64 = userSignatureBuffer.toString("base64");

    const result = await updateUserSignature({
      IICSAAM_USER_ID: userId,
      IICSAAM_USER_SIGN: userSignatureBase64,
    });

    res.status(200).json({ success: true, data: result });
  }
);
