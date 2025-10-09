const path = require("path");
const fs = require("fs");
const { templatesDir, generatedDir } = require("../config/paths");
const { listTemplates, generateFromTemplate } = require("../services/docService");
const { convertDocxToPdfWithLibre } = require("../utils/libreConvert");

async function uploadTemplate(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    // file already saved by multer into templatesDir
    return res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getTemplates(req, res) {
  try {
    const files = listTemplates();
    res.json({ success: true, templates: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * body:
 * {
 *   template: "nomas_sablonas.docx",
 *   data: { nomnieks_vards: "...", ... },
 *   to: "docx" or "pdf" (optional, default docx)
 * }
 */
async function generateDocument(req, res) {
  try {
    const { template, data } = req.body;
    const to = (req.body.to || "docx").toLowerCase();

    if (!template || !data) return res.status(400).json({ success: false, message: "template and data are required" });

    const outPath = await generateFromTemplate(template, data);

    if (to === "pdf") {
      // convert via libreoffice
      try {
        const pdfPath = await convertDocxToPdfWithLibre(outPath, generatedDir);
        // send PDF
        return res.download(pdfPath, path.basename(pdfPath), (err) => {
          if (err) console.error("Download error:", err);
        });
      } catch (convErr) {
        console.error("Conversion failed:", convErr);
        // fallback: send docx if conversion failed
        return res.status(500).json({ success: false, message: "PDF conversion failed: " + convErr.message });
      }
    }

    // default: return generated docx
    return res.download(outPath, path.basename(outPath), (err) => {
      if (err) console.error("Download error:", err);
    });
  } catch (err) {
    console.error("Generate document error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  uploadTemplate,
  getTemplates,
  generateDocument,
};
