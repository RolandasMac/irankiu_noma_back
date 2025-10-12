import path from "path";

// Jei reikia __dirname analogui ESM režime
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, ".."); // projekto šaknis
const storeRoot = path.join(rootDir, "store");

const imageUploadsDir = path.join(storeRoot, "imageUploads");

export default {
  imageUploadsDir,
};
