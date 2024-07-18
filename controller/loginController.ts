import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const commonFunction = require("../../../utils/commonFunction");
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to create refresh token
const createRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

//@desc    Check the status of a user based on their OTP and refresh token
//@route   GET  /api/v1/users/:id/otp
//@access  Private

export const checkUserStatus = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists
    const userExistsSql = `
      SELECT COUNT(*) AS userCount
      FROM IICSAAK_USER_MASTER
      WHERE IICSAAK_USER_ID = :userId
    `;
    const userExistsBind = { userId };
    const userResult = await commonFunction.functionSelect(
      userExistsSql,
      userExistsBind
    );

    if (
      !userResult ||
      userResult.length === 0 ||
      userResult[0].userCount === 0
    ) {
      return res
        .status(404)
        .json({
          status: "false",
          otpStatus: "NODATAFOUND",
          message: "ENTER OTP AND NEW PASSWORD",
        });
    }

    // Fetch OTP details from the database
    const fetchUserStatusSql = `
      SELECT IICSAAW_USER_OTP, IICSAAW_REFRESH_TOKEN, IICSAAW_TOKEN_EXPIRY_DATE
      FROM IICSAAW_USER_OTP_DETAILS
      WHERE IICSAAW_USER_ID = :userId
    `;
    const fetchUserStatusBind = { userId };
    const result = await commonFunction.functionSelect(
      fetchUserStatusSql,
      fetchUserStatusBind
    );

    if (!result || result.length === 0) {
      await sendNewOtp(userId);
      return res
        .status(404)
        .json({
          status: "false",
          otpStatus: "NODATAFOUND",
          message: "ENTER OTP AND NEW PASSWORD",
        });
    }

    const otpDetails = result[0];
    const now = new Date();
    const expiryDate = new Date(otpDetails.IICSAAW_TOKEN_EXPIRY_DATE);

    if (now > expiryDate) {
      await sendNewOtp(userId);
      return res
        .status(401)
        .json({
          status: "false",
          otpStatus: "EXPIREDOTP",
          message: "ENTER OTP AND NEW PASSWORD",
        });
    }

    return res
      .status(200)
      .json({
        status: "true",
        otpStatus: "VERIFIED",
        message: "User has a valid OTP",
      });
  } catch (error: any) {
    console.error("Error checking user status:", error);
    return res
      .status(500)
      .json({
        message: "Error checking user status",
        errorMessage: error.message,
      });
  }
};

// Helper function to send a new OTP
const sendNewOtp = async (userId: string) => {
  // Fetch mobile number associated with the user ID
  const fetchMobileSql = `
    SELECT IICSAAK_PRIM_MOBILE_NO
    FROM IICSAAK_USER_MASTER
    WHERE IICSAAK_USER_ID = :userId
  `;
  const fetchMobileBind = { userId };
  const result = await commonFunction.functionSelect(
    fetchMobileSql,
    fetchMobileBind
  );

  if (!result || result.length === 0 || !result[0].IICSAAK_PRIM_MOBILE_NO) {
    throw new Error("Mobile number not found for the provided user ID");
  }

  const mobileNumber = result[0].IICSAAK_PRIM_MOBILE_NO.trim();
  const otp = generateOtp();
  const refreshToken = createRefreshToken(userId);
  const tokenExpiry = new Date();
  tokenExpiry.setMonth(tokenExpiry.getMonth() + 1);

  const upsertOtpSql = `
    MERGE INTO IICSAAW_USER_OTP_DETAILS t
    USING (SELECT :userId AS userId FROM dual) s
    ON (t.IICSAAW_USER_ID = s.userId)
    WHEN MATCHED THEN
      UPDATE SET IICSAAW_USER_OTP = :otp, IICSAAW_REFRESH_TOKEN = :refreshToken, IICSAAW_TOKEN_EXPIRY_DATE = :tokenExpiry
    WHEN NOT MATCHED THEN
      INSERT (IICSAAW_USER_ID, IICSAAW_USER_OTP, IICSAAW_REFRESH_TOKEN, IICSAAW_TOKEN_EXPIRY_DATE)
      VALUES (:userId, :otp, :refreshToken, :tokenExpiry)
  `;
  const otpBind = { userId, otp, refreshToken, tokenExpiry };
  await commonFunction.functionInsert(upsertOtpSql, otpBind);

  const smsUrl = `http://cloudsms.inwayhosting.com/ApiSmsHttp?UserId=sms@psgimsr.ac.in&pwd=Psg@123&Message=Your+One+Time+Password+for+PSG+Hospitals+is+${otp}.+Do+not+share+OTP+with+anyone.&Contacts=${mobileNumber}&SenderId=PSGAPP&ServiceName=SMSTRANS&MessageType=1`;

  await axios.get(smsUrl);
  console.log(`New OTP sent: ${otp}, URL: ${smsUrl}`);
};

//@desc     Verify the user based upon the OTP
//@route    POST  /api/v1/users/:id/otp/verify
//@access   Private

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.params;
    const { otp, newPassword } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ error: "User ID and OTP are required" });
    }

    // Fetch OTP details from the database
    const fetchOtpSql = `
      SELECT IICSAAW_USER_OTP, IICSAAW_REFRESH_TOKEN, IICSAAW_TOKEN_EXPIRY_DATE
      FROM IICSAAW_USER_OTP_DETAILS
      WHERE IICSAAW_USER_ID = :userId
    `;
    const fetchOtpBind = { userId };
    const result = await commonFunction.functionSelect(
      fetchOtpSql,
      fetchOtpBind
    );

    if (!result || result.length === 0 || !result[0].IICSAAW_USER_OTP) {
      return res
        .status(404)
        .json({
          status: "false",
          otpStatus: "NODATAFOUND",
          message: "ENTER OTP",
        });
    }

    const otpDetails = result[0];
    const fetchedOTP = otpDetails.IICSAAW_USER_OTP.toString().trim();
    const expiryDate = new Date(otpDetails.IICSAAW_TOKEN_EXPIRY_DATE);

    // Check if OTP is expired
    if (new Date() > expiryDate) {
      // Generate a new OTP and update the table
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiryDate = new Date();
      newExpiryDate.setMinutes(newExpiryDate.getMinutes() + 5); // Set new expiry time to 5 minutes from now

      const updateOtpSql = `
        UPDATE IICSAAW_USER_OTP_DETAILS
        SET IICSAAW_USER_OTP = :newOtp, IICSAAW_TOKEN_EXPIRY_DATE = :newExpiryDate
        WHERE IICSAAW_USER_ID = :userId
      `;
      const updateOtpBind = { userId, newOtp, newExpiryDate };
      await commonFunction.functionUpdate(updateOtpSql, updateOtpBind);

      return res
        .status(401)
        .json({
          status: "false",
          otpStatus: "EXPIREDOTP",
          message: "OTP expired, a new OTP has been sent. Please verify again.",
        });
    }

    // Check if the provided OTP matches the fetched OTP
    if (fetchedOTP !== otp.trim()) {
      return res.status(400).json({ status: "false", message: "Invalid OTP" });
    }

    // If newPassword is provided, update the password
    if (newPassword) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Insert the new password into the PASSWORD_HISTORY table
      const insertPasswordHistorySql = `
        INSERT INTO IICSAAU_PASSWORD_HISTORY (IICSAAU_USER_ID, IICSAAU_PASSWORD, IICSAAU_PWD_LASTUPDATE)
        VALUES (:userId, :hashedPassword, SYSDATE)
      `;
      const insertPasswordHistoryBind = { userId, hashedPassword };
      await commonFunction.functionInsert(
        insertPasswordHistorySql,
        insertPasswordHistoryBind
      );
    }

    return res
      .status(200)
      .json({
        status: "true",
        otpStatus: "VERIFIED",
        message: "OTP verified successfully",
      });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ error: "Error verifying OTP", errorMessage: error.message });
  }
};

//@desc     Handle user login by verifying credentials and issuing a token
//@route    POST /api/v1/login
//@access   Private

export const handleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { USER_ID, PASSWORD } = req.body;

  try {
    if (!USER_ID || !PASSWORD) {
      res.status(400).json({ message: "User ID and Password are required" });
      return;
    }

    console.log(`Received login request with USER_ID: ${USER_ID}`);

    let fetchUserIdSql = `
      SELECT IICSAAK_USER_ID
      FROM IICSAAK_USER_MASTER
    `;
    const fetchUserIdBind: any = {};

    if (/^\d{10}$/.test(USER_ID)) {
      console.log("Detected USER_ID as a mobile number");
      fetchUserIdSql += `
        WHERE IICSAAK_PRIM_MOBILE_NO = :userId
      `;
      fetchUserIdBind.userId = USER_ID;
    } else {
      console.log("Detected USER_ID as a regular user ID");
      fetchUserIdSql += `
        WHERE IICSAAK_USER_ID = :userId
      `;
      fetchUserIdBind.userId = USER_ID;
    }

    console.log("Executing SQL to fetch user ID:");
    console.log(fetchUserIdSql);
    console.log("With binds:");
    console.log(fetchUserIdBind);

    const result = await commonFunction.functionSelect(
      fetchUserIdSql,
      fetchUserIdBind
    );

    console.log("Query result (User Master):");
    console.log(result);

    if (!result || result.length === 0) {
      res
        .status(404)
        .json({
          status: "false",
          message:
            "User not found or no password found for the provided user ID",
        });
      return;
    }

    const userId = result[0].IICSAAK_USER_ID;

    // Fetch hashed password from password history table
    const fetchPasswordSql = `
      SELECT IICSAAU_PASSWORD
      FROM IICSAAU_PASSWORD_HISTORY
      WHERE IICSAAU_USER_ID = :userId
      ORDER BY IICSAAU_ENTRY_DATE DESC
      FETCH FIRST 1 ROWS ONLY
    `;
    const fetchPasswordBind = { userId };

    console.log("Executing SQL to fetch password:");
    console.log(fetchPasswordSql);
    console.log("With binds:");
    console.log(fetchPasswordBind);

    const passwordResult = await commonFunction.functionSelect(
      fetchPasswordSql,
      fetchPasswordBind
    );

    console.log("Password query result:");
    console.log(passwordResult);

    if (!passwordResult || passwordResult.length === 0) {
      res
        .status(404)
        .json({ status: "false", message: "Password not found for the user" });
      return;
    }

    const hashedPasswordFromDB = passwordResult[0].IICSAAU_PASSWORD;

    // Compare hashed passwords
    const isPasswordMatch = await bcrypt.compare(
      PASSWORD,
      hashedPasswordFromDB
    );

    if (!isPasswordMatch) {
      res.status(401).json({ status: "false", message: "Invalid password" });
      return;
    }

    let accessToken: string;
    let refreshToken: string | null = null; // Initialize refreshToken with null

    // Check if there is an existing refresh token in cookies
    const existingAccessToken = req.cookies.accessToken;
    const existingRefreshToken = req.cookies.refreshToken;

    if (existingRefreshToken) {
      try {
        // Verify the existing refresh token
        const decodedRefreshToken = jwt.verify(
          existingRefreshToken,
          process.env.JWT_SECRET as string
        );

        // Refresh the access token if expired or not present
        if (
          !existingAccessToken ||
          !jwt.verify(existingAccessToken, process.env.JWT_SECRET as string)
        ) {
          accessToken = jwt.sign(
            { userId: USER_ID },
            process.env.JWT_SECRET as string,
            { expiresIn: "1m" }
          );

          // Set the new access token in cookies
          res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 60000,
          }); // 1 minute
        } else {
          accessToken = existingAccessToken;
        }

        // Use the existing refresh token
        refreshToken = existingRefreshToken;
      } catch (error) {
        // Refresh token expired, generate new refresh and access tokens
        refreshToken = jwt.sign(
          { userId: USER_ID },
          process.env.JWT_SECRET as string,
          { expiresIn: "3m" }
        );
        accessToken = jwt.sign(
          { userId: USER_ID },
          process.env.JWT_SECRET as string,
          { expiresIn: "1m" }
        );

        // Insert login details into the database
        const insertLoginSql = `
          MERGE INTO IICSAAV_LOGIN_DETAILS t
          USING (SELECT :userId AS userId, :refreshToken AS refreshToken FROM dual) s
          ON (t.IICSAAV_USER_ID = s.userId)
          WHEN MATCHED THEN
            UPDATE SET t.IICSAAV_REFRESH_TOKEN = s.refreshToken,
                       t.IICSAAV_TOKEN_EXPIRY_DATE = CURRENT_TIMESTAMP + INTERVAL '1' DAY
          WHEN NOT MATCHED THEN
            INSERT (IICSAAV_USER_ID, IICSAAV_LOGIN_TIME, IICSAAV_REFRESH_TOKEN, IICSAAV_TOKEN_EXPIRY_DATE)
            VALUES (s.userId, CURRENT_TIMESTAMP, s.refreshToken, CURRENT_TIMESTAMP + INTERVAL '1' DAY)
        `;
        const loginBind = {
          userId: USER_ID,
          refreshToken,
        };

        await commonFunction.functionInsert(insertLoginSql, loginBind);

        // Set tokens in response cookies
        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 60000,
        }); // 1 minute
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 180000,
        }); // 3 minutes
      }
    } else {
      // Generate new tokens if no existing tokens are found
      accessToken = jwt.sign(
        { userId: USER_ID },
        process.env.JWT_SECRET as string,
        { expiresIn: "1m" }
      );
      refreshToken = jwt.sign(
        { userId: USER_ID },
        process.env.JWT_SECRET as string,
        { expiresIn: "3m" }
      );

      // Insert login details into the database
      const insertLoginSql = `
        MERGE INTO IICSAAV_LOGIN_DETAILS t
        USING (SELECT :userId AS userId, :refreshToken AS refreshToken FROM dual) s
        ON (t.IICSAAV_USER_ID = s.userId)
        WHEN MATCHED THEN
          UPDATE SET t.IICSAAV_REFRESH_TOKEN = s.refreshToken,
                     t.IICSAAV_TOKEN_EXPIRY_DATE = CURRENT_TIMESTAMP + INTERVAL '1' DAY
        WHEN NOT MATCHED THEN
          INSERT (IICSAAV_USER_ID, IICSAAV_LOGIN_TIME, IICSAAV_REFRESH_TOKEN, IICSAAV_TOKEN_EXPIRY_DATE)
          VALUES (s.userId, CURRENT_TIMESTAMP, s.refreshToken, CURRENT_TIMESTAMP + INTERVAL '1' DAY)
      `;
      const loginBind = {
        userId: USER_ID,
        refreshToken,
      };

      await commonFunction.functionInsert(insertLoginSql, loginBind);

      // Set tokens in response cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60000,
      }); // 1 minute
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 180000,
      }); // 3 minutes
    }

    // Set tokens in response headers (optional)
    res.setHeader("accessToken", accessToken);
    if (refreshToken) {
      res.setHeader("refreshToken", refreshToken);
    }

    // Send a success response
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    res
      .status(200)
      .json({
        status: "true",
        message: "Login successful",
        accessToken,
        refreshToken,
      });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleLogin, checkUserStatus, verifyOTP };
