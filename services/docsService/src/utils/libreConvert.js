import fs from "fs";
import path from "path";
import libre from "libreoffice-convert";

export async function convertDocxToPdfWithLibre(inputPath, outputDir) {
  const outputPath = path.join(
    outputDir,
    `${path.basename(inputPath, ".docx")}.pdf`
  );

  const input = fs.readFileSync(inputPath);

  return new Promise((resolve, reject) => {
    libre.convert(input, ".pdf", undefined, (err, done) => {
      if (err) return reject(err);
      fs.writeFileSync(outputPath, done);
      resolve(outputPath);
    });
  });
}
