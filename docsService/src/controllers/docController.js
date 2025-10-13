import path from "path";
import fs from "fs";
import paths from "../../../config/paths.js";
import { listTemplates, generateFromTemplate } from "../services/docService.js";
import { convertDocxToPdfWithLibre } from "../utils/libreConvert.js";

const { templatesDir, generatedDir } = paths;
export async function uploadTemplate(req, res) {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    return res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTemplates(req, res) {
  try {
    const files = listTemplates();
    res.json({ success: true, templates: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function generateDocument(req, res) {
  try {
    const { template, data, to = "docx" } = req.body;

    if (!template || !data)
      return res
        .status(400)
        .json({ success: false, message: "template and data are required" });

    const parsedData = typeof data === "string" ? JSON.parse(data) : data;

    const outPath = await generateFromTemplate(template, parsedData);

    if (to.toLowerCase() === "pdf") {
      try {
        const pdfPath = await convertDocxToPdfWithLibre(outPath, generatedDir);
        return res.download(pdfPath, path.basename(pdfPath));
      } catch (err) {
        console.error("PDF conversion failed:", err);
        return res.status(500).json({
          success: false,
          message: "PDF conversion failed: " + err.message,
        });
      }
    }

    return res.download(outPath, path.basename(outPath));
  } catch (err) {
    console.error("Generate document error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
