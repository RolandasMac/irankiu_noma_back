// import fs from "fs";
// import path from "path";
// import PizZip from "pizzip";
// import Docxtemplater from "docxtemplater";
// import paths from "../../../config/paths.js";

// const { templatesDir, generatedDir } = paths;
// export function listTemplates() {
//   return fs.readdirSync(templatesDir).filter((f) => f.endsWith(".docx"));
// }

// export async function generateFromTemplate(templateName, data) {
//   const templatePath = path.join(templatesDir, templateName);
//   if (!fs.existsSync(templatePath)) throw new Error("Template not found");

//   const content = fs.readFileSync(templatePath, "binary");
//   const zip = new PizZip(content);
//   const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

//   // doc.setData(data);
//   // doc.render();
//   doc.render(data);

//   const buffer = doc.getZip().generate({ type: "nodebuffer" });
//   const name = `${path.basename(templateName, ".docx")}_${Date.now()}.docx`;
//   const outFile = path.join(generatedDir, name);

//   fs.writeFileSync(outFile, buffer);
//   return name;
// }

import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import libre from "libreoffice-convert";
import paths from "../../../config/paths.js";
const { templatesDir, generatedDir } = paths;

// Nurodom statiškai
export const listTemplates = {
  sutartis: "1760029140328-nomas ligums1.docx",
  // sutartis: "sutartis_template.docx",
  // saskaita: "saskaita_template.docx",
  // kvitas: "kvitas_template.docx",
};

// Nurodom dinamiškai
// export function listTemplates() {
//   return fs.readdirSync(templatesDir).filter((f) => f.endsWith(".docx"));
// }
// const generatedDir = path.resolve("generated");

export async function generateFromTemplate(order) {
  if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir);

  const results = [];

  for (const [type, templateName] of Object.entries(listTemplates)) {
    console.log("templateName", templateName, order);
    // const templatePath = path.resolve("templates", templateName);
    const templatePath = path.join(templatesDir, templateName);
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(order.order.client);

    const buf = doc.getZip().generate({ type: "nodebuffer" });
    const fileName = `${type}_${order.order.id}.docx`;
    const filePath = path.join(generatedDir, fileName);
    fs.writeFileSync(filePath, buf);

    results.push({ type, url: `${fileName}` });
  }
  console.log("results", results);
  return results;
}
