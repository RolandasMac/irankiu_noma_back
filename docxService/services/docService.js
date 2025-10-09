const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { templatesDir, generatedDir } = require("../config/paths");

// ensure dirs
if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

function listTemplates() {
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".docx"));
  return files;
}

function getTemplatePath(filename) {
  return path.join(templatesDir, filename);
}

async function generateFromTemplate(templateFilename, data) {
  const templatePath = getTemplatePath(templateFilename);
  if (!fs.existsSync(templatePath)) throw new Error("Template not found");

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // render (docxtemplater will throw if placeholder missing by default)
  doc.render(data);

  const buf = doc.getZip().generate({ type: "nodebuffer" });
  const outFilename = `${path.basename(templateFilename, path.extname(templateFilename))}_${Date.now()}.docx`;
  const outPath = path.join(generatedDir, outFilename);
  fs.writeFileSync(outPath, buf);
  return outPath;
}

module.exports = {
  listTemplates,
  getTemplatePath,
  generateFromTemplate,
};
