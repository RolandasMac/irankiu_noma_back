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
import paths from "../../../../config/paths.js";
import { numberToWords, locales } from "./../utils/numberToWords.js";

const { templatesDir, generatedDir } = paths;

// Nurodom statiškai
export const listTemplates = {
  contract: "Nomas ligums.docx",
  receipt: "Kvits.docx",
  invoice: "Rekins.docx",
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
  const createdData = createOrderdata(order.order);
  for (const [type, templateName] of Object.entries(listTemplates)) {
    console.log("templateName", templateName, order);
    console.log("duomenys po paruošimo funkcijos", createdData);
    // const templatePath = path.resolve("templates", templateName);
    const templatePath = path.join(templatesDir, templateName);
    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(createdData);

    const buf = doc.getZip().generate({ type: "nodebuffer" });
    const fileName = `${type}_${createdData.id}.docx`;
    const filePath = path.join(generatedDir, fileName);
    fs.writeFileSync(filePath, buf);

    results.push({ type, url: `${fileName}` });
  }
  console.log("results", results);
  return results;
}

// Funkcija paruošti duomenis

function createOrderdata(data) {
  console.log("Duomenys prieš paruošimą iš funkcijos", data);
  const locale = locales[data.lang];
  const totallSum = data.pay_sum + data.tool.depozit;
  const pay_sum_words = numberToWords(totallSum, locale);
  const newData = {
    id: data.id,
    dateNow: new Date().toLocaleDateString(),
    clientName: data.client.name,
    addres: data.client.addres,
    email: data.client.email,
    phone: data.client.phone,
    toolName: data.tool.toolName,
    toolPrice: data.tool.toolPrice,
    depozit: data.tool.depozit,
    dateFrom: new Date(data.date).toLocaleString(),
    dateUntil: new Date(data.date_until).toLocaleString(), //data.date_until,
    rentPrice: data.tool.rentPrice,
    pay_sum: data.pay_sum,
    days: data.days,
    payment_method: data.payment_method.label,
    pvnNr: data.client.pvnNr ? data.client.pvnNr : "",
    pay_sum_words: pay_sum_words,
    clientId: data.client.id,
    total_sum: totallSum,
    contractNr: data.docNr.contractNr,
    invoiceNr: data.docNr.invoiceNr,
    receiptNr: data.docNr.receiptNr,
  };
  return newData;
}
