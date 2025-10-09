const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

function convertDocxToPdfWithLibre(inputPath, outDir) {
  return new Promise((resolve, reject) => {
    // ensure output directory exists
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // soffice (libreoffice) command
    // convert to pdf and put result to outDir
    const cmd = `soffice --headless --convert-to pdf --outdir "${outDir}" "${inputPath}"`;

    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`LibreOffice convert error: ${stderr || err.message}`));
      }
      // expected output file path: same basename, .pdf extension
      const pdfPath = path.join(outDir, path.basename(inputPath, path.extname(inputPath)) + ".pdf");
      if (!fs.existsSync(pdfPath)) {
        return reject(new Error("PDF not found after LibreOffice conversion"));
      }
      resolve(pdfPath);
    });
  });
}

module.exports = { convertDocxToPdfWithLibre };
