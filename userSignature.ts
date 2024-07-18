// Import required modules and dependencies
const oracledb = require("oracledb");
const commonFunction = require("../../utils/commonFunction");

// Define interfaces for user signature data
interface UserSignature {
  IICSAAM_USER_ID: string;
  IICSAAM_USER_SIGN?: string; // Base64 encoded signature
}

// Utility function: Check mandatory fields
const checkMandatoryFields = (user: UserSignature) => {
  const mandatoryFields = ["IICSAAM_USER_ID"];
  for (const field of mandatoryFields) {
    if (!user[field as keyof UserSignature]) {
      throw new Error(`Please enter mandatory field: ${field}`);
    }
  }
};

// Select user signature by user ID
export const selectUserSignature = async (userId: string) => {
  const sql =
    "SELECT IICSAAM_USER_SIGN FROM IICSAAM_USER_SIGNATURE WHERE IICSAAM_USER_ID = :userId";
  const bind = [userId];
  const result = await commonFunction.functionSelect(sql, bind);
  if (result.rows.length > 0) {
    return result.rows[0].IICSAAM_USER_SIGN;
  } else {
    throw new Error(`User with ID ${userId} not found`);
  }
};

// Insert user signature
export async function insertUserSignature(data: UserSignature) {
  try {
    // Validate input data
    if (!data.IICSAAM_USER_ID) {
      throw new Error("IICSAAM_USER_ID is required");
    }

    console.log("Data to be inserted:", data);

    // Construct the SQL INSERT statement
    const sql = `INSERT INTO IICSAAM_USER_SIGNATURE (IICSAAM_USER_ID, IICSAAM_USER_SIGN) VALUES (:IICSAAM_USER_ID, :IICSAAM_USER_SIGN)`;

    // Transform the data object to a bind object
    const bind: { [key in keyof UserSignature]?: any } = {};
    bind.IICSAAM_USER_ID = data.IICSAAM_USER_ID;
    bind.IICSAAM_USER_SIGN = data.IICSAAM_USER_SIGN
      ? {
          val: Buffer.from(data.IICSAAM_USER_SIGN, "base64"),
          type: oracledb.BLOB,
        }
      : null;

    console.log("SQL to execute:", sql);
    const result = await commonFunction.functionInsert(sql, bind);
    console.log("Insertion result:", result);

    return result;
  } catch (error) {
    console.error("Error occurred:", error);
    throw error; // Propagate the error back to the caller
  }
}

// Update user signature
export const updateUserSignature = async (user: UserSignature) => {
  checkMandatoryFields(user); // Ensure mandatory fields are present

  const binds: { [key: string]: any } = {
    IICSAAM_USER_ID: user.IICSAAM_USER_ID,
  };

  // Check if IICSAAM_USER_SIGN is provided and convert it to BLOB if so
  if (user.IICSAAM_USER_SIGN) {
    binds.IICSAAM_USER_SIGN = {
      val: Buffer.from(user.IICSAAM_USER_SIGN, "base64"),
      type: oracledb.BLOB,
    };
  }

  // Construct the SQL update statement
  const sql = `UPDATE IICSAAM_USER_SIGNATURE SET IICSAAM_USER_SIGN = :IICSAAM_USER_SIGN WHERE IICSAAM_USER_ID = :IICSAAM_USER_ID`;

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

// Delete user signature by user ID
export const deleteUserSignature = async (userId: string) => {
  console.log("Received userId:", userId);

  if (!userId) {
    throw new Error("userId is required");
  }

  const sql =
    "DELETE FROM IICSAAM_USER_SIGNATURE WHERE IICSAAM_USER_ID = :userId";
  const bind = [userId]; // Pass as an array to match bind parameters

  console.log("SQL to execute:", sql);
  console.log("Bind parameters:", bind);

  try {
    // Perform the delete operation
    const result = await commonFunction.functionDelete(sql, bind);
    console.log("Deletion result:", result);

    if (result?.RecordsAffected === 0) {
      throw new Error(
        `User with ID ${userId} not found or no signature associated.`
      );
    }

    return {
      status: true,
      message: `Signature deleted successfully for user with ID: ${userId}`,
      recordsAffected: result?.RecordsAffected || 0,
    };
  } catch (error: any) {
    console.error("Error deleting signature:", error);
    throw error; // Propagate the error back to the caller
  }
};
