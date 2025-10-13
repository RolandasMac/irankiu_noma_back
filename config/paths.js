import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.join(__dirname, ".."); // projekto šaknis
const storeRoot = path.join(rootDir, "store");
const imageUploadsDir = path.join(storeRoot, "imageUploads");
const templatesDir = path.join(storeRoot, "templates");
const generatedDir = path.join(storeRoot, "generated");

export default {
  imageUploadsDir,
  templatesDir,
  generatedDir,
};

for (const dir of [imageUploadsDir, templatesDir, generatedDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
