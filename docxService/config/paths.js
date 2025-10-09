const path = require("path");
const rootDir = path.join(__dirname, ".."); // project root
const storeDir = path.join(rootDir, "store");

const templatesDir = path.join(storeDir, "templates");
const generatedDir = path.join(storeDir, "generated");

module.exports = {
  rootDir,
  storeDir,
  templatesDir,
  generatedDir,
};
