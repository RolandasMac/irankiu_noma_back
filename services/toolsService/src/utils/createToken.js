import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
const tokenSecret = process.env.MANUAL_DOWNLOAD_SECRET;
export function createToken(toolId) {
  try {
    // console.log("Veikia", toolId, tokenSecret);
    if (!toolId) {
      console.log("Tool ID is missing");
      throw new Error("Tool ID is required");
    }

    const token = jwt.sign(
      {
        toolId: toolId,
        type: "manual_download",
      },
      tokenSecret,
      { expiresIn: "10d" }
    );

    return token;
  } catch (error) {
    console.error(error);
    return error.message;
  }
}
