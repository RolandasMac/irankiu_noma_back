import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import libre from "libreoffice-convert";
import paths from "../../../../config/paths.js";
import { numberToWords, locales } from "./../utils/numberToWords.js";

const { templatesDir, generatedDir } = paths;
export async function generateFromTemplate(order, newTemplates) {
  if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir);
  const results = [];
  const createdData = createOrderdata(order);
  for (const [type, templateName] of Object.entries(newTemplates)) {
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

  return results;
}
// Funkcija paruošti duomenis
function createOrderdata(data) {
  const locale = locales[data.lang];
  const totallSum = data.pay_sum + data.addons_total + data.depozit;
  const pay_sum_words = numberToWords(totallSum, locale);
  // kuriame sąliginį laukelų, jeigu priedas egzistuoja
  const has_addons = data.addons.length > 0;
  const addons_withtotal = data.addons.map((addon) => {
    return {
      ...addon,
      total: (addon.price * addon.quantity).toFixed(2),
      price: addon.price.toFixed(2),
    };
  });
  const newData = {
    id: data.id,
    dateNow: new Date().toLocaleDateString("lv-LV"),
    clientName: data.client.name,
    clientId: data.client.id,
    addres: data.client.addres,
    email: data.client.email,
    phone: data.client.phone,
    toolName: data.tool.toolName,
    toolPrice: data.tool.toolPrice.toFixed(2),
    toolDescriptions: data.tool.description,
    depozit: data.depozit.toFixed(2),
    dateFrom: new Date(data.date).toLocaleString("lv-LV"),
    dateUntil: new Date(data.date_until).toLocaleString("lv-LV"), //data.date_until,
    rentPrice: data.tool.rentPrice,
    pay_sum: data.pay_sum.toFixed(2),
    days: data.days,
    payment_method: data.payment_method.label,
    pvnNr: data.client.pvnNr ? data.client.pvnNr : "",
    pay_sum_words: pay_sum_words,
    clientId: data.client.id,
    total_sum: totallSum.toFixed(2),
    contractNr: data.docNr.contractNr,
    invoiceNr: data.docNr.invoiceNr,
    receiptNr: data.docNr.receiptNr,
    addons_total: data.addons_total.toFixed(2),
    has_addons: has_addons,
    addons: addons_withtotal,
  };
  return newData;
}
