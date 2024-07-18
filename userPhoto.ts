// Import required modules and dependencies
import oracledb from "oracledb";
const commonFunction = require("../../utils/commonFunction");
import ip from "ip";
import os from "os";

// Define interfaces for user and photo data
interface User {
  IICSAAL_USER_ID: string;
  IICSAAL_USER_Photo?: string;
}

// Utility function: Check mandatory fields
const checkMandatoryFields = (user: User) => {
  const mandatoryFields = ["IICSAAL_USER_ID"];
  for (const field of mandatoryFields) {
    if (!user[field as keyof User]) {
      throw new Error(`Please enter mandatory field: ${field}`);
    }
  }
};

// Insert user photo
export async function insertData(data: User) {
  try {
    // Validate input data
    if (!data.IICSAAL_USER_ID) {
      throw new Error("IICSAAL_USER_ID is required");
    }

    console.log("Data to be inserted:", data);

    // Construct the SQL INSERT statement
    const sql = `
      INSERT INTO IICSAAL_USER_PHOTO (
        IICSAAL_USER_ID,
        IICSAAL_USER_Photo,
        IICSAAL_ENTRY_USER,
        IICSAAL_MODIFY_USER,
        IICSAAL_ENTRY_DATE,
        IICSAAL_MODIFY_DATE,
        IICSAAL_HOST_NAME,
        IICSAAL_IP_ADDRESS
      ) VALUES (
        :IICSAAL_USER_ID,
        :IICSAAL_USER_Photo,
        :IICSAAL_ENTRY_USER,
        :IICSAAL_MODIFY_USER,
        TO_DATE(:IICSAAL_ENTRY_DATE, 'YYYY-MM-DD'),
        TO_DATE(:IICSAAL_MODIFY_DATE, 'YYYY-MM-DD'),
        :IICSAAL_HOST_NAME,
        :IICSAAL_IP_ADDRESS
      )
    `;

    // Transform the data object to a bind object
    const bind: { [key: string]: any } = {};
    bind.IICSAAL_USER_ID = data.IICSAAL_USER_ID;
    bind.IICSAAL_USER_Photo = data.IICSAAL_USER_Photo;

    bind.IICSAAL_ENTRY_DATE = new Date().toISOString().slice(0, 10); // Today's date

    bind.IICSAAL_HOST_NAME = os.hostname();
    bind.IICSAAL_IP_ADDRESS = ip.address();

    // If userPhotoBase64 is provided, ensure it's treated appropriately
    if (data.IICSAAL_USER_Photo) {
      // Convert Base64 to Buffer or Blob as per OracleDB requirements
      bind.IICSAAL_USER_Photo = {
        val: Buffer.from(data.IICSAAL_USER_Photo, "base64"),
        type: oracledb.BLOB,
      };
    }

    console.log("SQL to execute:", sql);
    const result = await commonFunction.functionInsert(sql, bind);
    console.log("Insertion result:", result);

    return result;
  } catch (error) {
    console.error("Error occurred:", error);
    throw error; // Propagate the error back to the caller
  }
}

// Update user photo
export const updateUser = async (user: User) => {
  checkMandatoryFields(user); // Ensure mandatory fields are present

  const binds: { [key: string]: any } = {
    IICSAAL_USER_ID: user.IICSAAL_USER_ID,
  };

  // Check if IICSAAL_USER_Photo is provided and convert it to BLOB if so
  if (user.IICSAAL_USER_Photo) {
    binds.IICSAAL_USER_Photo = {
      val: Buffer.from(user.IICSAAL_USER_Photo, "base64"),
      type: oracledb.BLOB,
    };
  }

  // Construct the SQL update statement
  const sql = `UPDATE IICSAAL_USER_PHOTO SET IICSAAL_USER_Photo = :IICSAAL_USER_Photo WHERE IICSAAL_USER_ID = :IICSAAL_USER_ID`;

  try {
    // Perform the update operation
    const result = await commonFunction.functionUpdate(sql, binds);

    // Check if rows were affected by the update
    if (result.status && result.RecordsAffected === 0) {
      throw new Error("User ID does not exist.");
    }

    return result;
  } catch (error: any) {
    // Handle specific error if user ID doesn't exist
    if (error.errorNum === 1403 || error.message.includes("ORA-01403")) {
      throw new Error("User ID does not exist.");
    } else {
      throw error; // Propagate other errors
    }
  }
};

// Select user photo by user ID
export const selectUser = async (userId: string) => {
  const sql = "SELECT USER_PHOTO FROM USER WHERE USER_ID = :userId";
  const bind = [userId];
  const result = await commonFunction.functionSelect(sql, bind);
  if (result.rows.length > 0) {
    return result.rows[0].USER_PHOTO;
  } else {
    throw new Error(`User with ID ${userId} not found`);
  }
};

// Delete user photo by user ID
export const deleteImageById = async (userId: string) => {
  console.log("Received userId:", userId);

  if (!userId) {
    throw new Error("userId is required");
  }

  const sql = "DELETE FROM IICSAAL_USER_PHOTO WHERE IICSAAL_USER_ID = :userId";
  const bind = [userId]; // Pass as an array to match bind parameters

  console.log("SQL to execute:", sql);
  console.log("Bind parameters:", bind);

  try {
    // Perform the delete operation
    const result = await commonFunction.functionDelete(sql, bind);
    console.log("Deletion result:", result);

    if (result?.RecordsAffected === 0) {
      throw new Error(
        `User with ID ${userId} not found or no image associated.`
      );
    }

    return {
      status: true,
      message: `Image deleted successfully for user with ID: ${userId}`,
      recordsAffected: result?.RecordsAffected || 0,
    };
  } catch (error: any) {
    console.error("Error deleting image:", error);
    throw error; // Propagate the error back to the caller
  }
};
