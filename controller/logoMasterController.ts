// controllers/logoMaster.controller.ts

import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import {
  insertLogoMaster,
  updateLogoMaster,
  LogoMaster,
  selectLogoMaster,
} from "../../../models/IICSAA/logoMaster"; // Adjust the import path based on your project structure

// Handler for inserting a new LogoMaster
export const createLogoMaster = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logoMasterData: LogoMaster = req.body; // Assuming logo master data is passed in the request body

      // Call insertLogoMaster function to insert the LogoMaster
      const result = await insertLogoMaster(logoMasterData);

      // Respond with success message and inserted data
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error creating LogoMaster:", error);
      next({ status: 400, message: error.message }); // Pass error to Express error handler
    }
  }
);

// Handler for updating an existing LogoMaster
export const updateLogoMasterHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logoMasterData: LogoMaster = req.body; // Assuming logo master data is passed in the request body

      // Call updateLogoMaster function to update the LogoMaster
      const result = await updateLogoMaster(logoMasterData);

      // Respond with success message and updated data
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error updating LogoMaster:", error);
      next({ status: 400, message: error.message }); // Pass error to Express error handler
    }
  }
);

// Handler for selecting a LogoMaster by code
export const selectLogoMasterHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { logoCode } = req.query as { logoCode: string };

    try {
      if (!logoCode) {
        res
          .status(400)
          .json({ success: false, message: "Missing logo code parameter" });
        return;
      }

      const logoMaster = await selectLogoMaster(logoCode);

      if (logoMaster) {
        res.status(200).json({ success: true, data: logoMaster });
      } else {
        res.status(404).json({
          success: false,
          message: `Logo with code ${logoCode} not found`,
        });
      }
    } catch (error: any) {
      console.error("Error in selectLogoMasterHandler:", error);
      next({ status: 500, message: "Internal server error" });
    }
  }
);

// Adjust additional handlers as per your application's needs
