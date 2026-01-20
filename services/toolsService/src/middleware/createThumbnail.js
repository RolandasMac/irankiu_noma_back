import path from "path";
import fs from "fs";
import paths from "../../../../config/paths.js";
import { Poppler } from "node-poppler";
import sharp from "sharp";
import os from "os";

const poppler = new Poppler();
const { thumbnailsDir, toolManualsDir } = paths;

// export const createThumbnailsArrayMiddleware = async (req, res, next) => {
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({
//       success: false,
//       message:
//         "Nepavyko įkelti failų. Įsitikinkite, kad tai paveikslėliai ar PDF dokumentai.",
//     });
//   }
//   // req.files.forEach(async (file) =>
//   req.thumbnailsData = [];
//   console.log("Files", req.files);

//   for (const file of req.files) {
//     const originalFilePath = file.path;
//     const originalFileName = file.filename;
//     let finalThumbnailFileName;
//     let tempImagePath = null; // Laikinas kelias PDF konvertavimui

//     try {
//       if (file.mimetype.startsWith("manual/")) {
//         // Apdorojame vaizdo failus su Sharp
//         finalThumbnailFileName = `thumb-${originalFileName}`;
//         const thumbnailFilePath = path.join(
//           thumbnailsDir,
//           finalThumbnailFileName
//         );

//         await sharp(originalFilePath)
//           .resize(200, 200, {
//             fit: sharp.fit.inside,
//             withoutEnlargement: true,
//           })
//           .toFormat("jpeg", { quality: 80 })
//           .toFile(thumbnailFilePath);

//         console.log(`Failas įkeltas: ${originalFileName}`);
//         console.log(`Miniatiūra sugeneruota: ${finalThumbnailFileName}`);
//       } else if (file.mimetype === "application/pdf") {
//         console.log("mimetype suveikė", file.mimetype);
//         // Apdorojame PDF failus su pdf-poppler ir Sharp
//         // const poppler = new Poppler();

//         // Laikinas pavadinimas Poppler generuojamam paveikslėliui
//         // pdf-poppler prideda '-1' už pirmo puslapio, pvz., 'temp-pdf-thumb-12345-1.jpg'
//         const tempOutFilenameBase = `temp-pdf-thumb-${Date.now()}`;
//         const tempOutPath = path.join(thumbnailsDir, tempOutFilenameBase);

//         // const pdfToImageOptions = {
//         //   firstPage: 1, // Konvertuojame tik pirmą puslapį
//         //   lastPage: 1,
//         //   format: "jpeg", // Poppler išveda JPEG formatu
//         //   scale: 1000, // Didelė skalė, kad gautume geresnę pradinę kokybę prieš Sharp dydžio keitimą
//         //   outdir: thumbnailsDir, // Išvesties katalogas
//         //   outprefix: tempOutFilenameBase, // Išvesties failo prefiksas
//         // };

//         // ************************************
//         let opts = {
//           format: "jpeg",
//           out_dir: thumbnailsDir,
//           out_prefix: tempOutFilenameBase,
//           page: 1,
//         };

//         await Poppler.convert(originalFilePath, opts)
//           .then((res) => {
//             console.log("Successfully converted");
//           })
//           .catch((error) => {
//             console.error(error);
//           });

//         // *********************************

//         // Konvertuojame PDF į paveikslėlį
//         // await poppler.pdfToImage(originalFilePath, pdfToImageOptions);
//         tempImagePath = `${tempOutPath}-1.jpg`; // Pilnas kelias prie Poppler sugeneruoto paveikslėlio
//         console.log("Čia dar veikia", tempImagePath);
//         // Dabar naudojame Sharp, kad standartizuotume miniatiūros dydį ir pavadinimą
//         finalThumbnailFileName = `thumb-${originalFileName.replace(
//           /\.[^/.]+$/,
//           ""
//         )}.jpg`; // Pakeičiame plėtinį į .jpg
//         const thumbnailFilePath = path.join(
//           thumbnailsDir,
//           finalThumbnailFileName
//         );

//         await sharp(tempImagePath)
//           .resize(200, 200, {
//             fit: sharp.fit.inside,
//             withoutEnlargement: true,
//           })
//           .toFormat("jpeg", { quality: 80 })
//           .toFile(thumbnailFilePath);

//         console.log(`PDF įkeltas: ${originalFileName}`);
//         console.log(`PDF miniatiūra sugeneruota: ${finalThumbnailFileName}`);
//       } else {
//         // Tai neturėtų įvykti, jei fileFilter veikia tinkamai.
//         throw new Error("Netikėtas failo tipas, kurio neapdorojo serveris.");
//       }

//       // Ištriname laikiną paveikslėlį, jei PDF buvo konvertuotas
//       if (tempImagePath && fs.existsSync(tempImagePath)) {
//         fs.unlinkSync(tempImagePath);
//         console.log(`Laikinas failas ištrintas: ${tempImagePath}`);
//       }
//       const thumbnailsData = {
//         originalUrl: ``,
//         thumbnailUrl: `/thumbnails/${finalThumbnailFileName}`,
//         originalFileName: originalFileName,
//         thumbnailFileName: finalThumbnailFileName,
//       };
//       req.thumbnailsData.push(thumbnailsData);
//     } catch (error) {
//       console.error(
//         "Klaida apdorojant failą arba generuojant miniatiūrą:",
//         error
//       );

//       // Ištriname įkeltą originalų failą, jei apdorojimas nepavyko
//       fs.unlink(originalFilePath, (err) => {
//         if (err)
//           console.error(
//             "Klaida trinant įkeltą failą po apdorojimo klaidos:",
//             err
//           );
//       });

//       // Ištriname laikiną paveikslėlį, jei jis buvo sukurtas ir įvyko klaida
//       if (tempImagePath && fs.existsSync(tempImagePath)) {
//         fs.unlink(tempImagePath, (err) => {
//           if (err)
//             console.error(
//               "Klaida trinant laikiną failą po apdorojimo klaidos:",
//               err
//             );
//         });
//       }

//       res.status(500).json({
//         success: false,
//         message: `Klaida apdorojant failą: ${
//           error.message || "Nepavyko sugeneruoti miniatiūros."
//         }`,
//       });
//     }
//   }
//   return next();
//   res.json({
//     success: true,
//     message: "Failas sėkmingai įkeltas ir miniatiūra sugeneruota!",
//     ...thumbnailsData,
//   });
// };
// export const createThumbnailsMiddleware = async (req, res, next) => {
//   // console.log("Ar yra manual", req.files.manual);
//   if (!req.files.manual || req.files.manual.length === 0) {
//     // console.log("update thiumbnails neveikia!!! Neatsiųstas joks failas");
//     return next();
//   }
//   req.thumbnailsData = [];
//   let originalFileName = null;
//   let finalThumbnailFileName;
//   let tempPdfPath = null;
//   let tempImagePath = null;
//   let thumbnailBuffer = null;

//   try {
//     for (const file of req.files.manual) {
//       // console.log("forEach");
//       originalFileName = file.originalname;
//       if (file.mimetype === "application/pdf") {
//         // Laikinas failo prefiksas
//         const pdfBuffer = file.buffer;
//         tempPdfPath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
//         fs.writeFileSync(tempPdfPath, pdfBuffer);

//         // Konvertuojame pirmą puslapį į JPEG su Poppler
//         finalThumbnailFileName = `thumb-${Date.now()}-${originalFileName.replace(
//           /\.[^/.]+$/,
//           ""
//         )}.jpg`;
//         const tempOutBase = path.join(os.tmpdir(), finalThumbnailFileName);
//         await poppler.pdfToCairo(tempPdfPath, tempOutBase, {
//           jpegFile: true,
//           firstPageToConvert: 1,
//           lastPageToConvert: 1,
//         });
//         // node-poppler sukuria `tempOutPath-1.jpg`
//         tempImagePath = `${tempOutBase}-1.jpg`;

//         if (!fs.existsSync(tempImagePath)) {
//           throw new Error(
//             `Nepavyko sugeneruoti pirmo PDF puslapio: ${tempImagePath}`
//           );
//         }

//         // Resize su Sharp
//         thumbnailBuffer = await sharp(tempImagePath)
//           .resize(200, 200, {
//             fit: sharp.fit.inside,
//             withoutEnlargement: true,
//           })
//           .toFormat("jpeg", { quality: 80 })
//           // .toFile(thumbnailFilePath);
//           .toBuffer();

//         // console.log(`PDF įkeltas: ${finalThumbnailFileName}`);
//       } else {
//         throw new Error("Netikėtas failo tipas, kurio neapdorojo serveris.");
//       }

//       // Ištriname laikiną failą (jeigu buvo sukurtas PDF konvertavimo metu)
//       if (tempImagePath && fs.existsSync(tempImagePath)) {
//         fs.unlinkSync(tempPdfPath);
//         fs.unlinkSync(tempImagePath);
//         // console.log(`Laikinas failas ištrintas: ${tempImagePath}`);
//       }

//       req.thumbnailsData.push({
//         fieldname: "thumbnail",
//         thumbnailName: finalThumbnailFileName,
//         originalname: originalFileName,
//         encoding: "7bit",
//         mimetype: "image/jpeg",
//         buffer: thumbnailBuffer,
//         size: thumbnailBuffer.length,
//       });
//     }
//     // console.log("Čia veikia middleware", req.thumbnailsData);
//     return next();
//   } catch (error) {
//     console.error(
//       "Klaida apdorojant failą arba generuojant miniatiūrą:",
//       error
//     );

//     // // Ištriname įkeltą originalą
//     // fs.unlink(originalFilePath, (err) => {
//     //   if (err) console.error("Klaida trinant įkeltą failą:", err);
//     // });

//     // Ištriname laikiną failą
//     if (tempImagePath && fs.existsSync(tempImagePath)) {
//       fs.unlink(tempImagePath, (err) => {
//         if (err) console.error("Klaida trinant laikiną failą:", err);
//       });
//     }
//     req.thumbnailsData = [];
//     res.status(500).json({
//       success: false,
//       message: `Klaida apdorojant failą: ${
//         error.message || "Nepavyko sugeneruoti miniatiūros."
//       }`,
//     });
//   }
// };
// export const updateThumbnailsMiddleware = async (req, res, next) => {
//   if (!req.files.new_manuals || req.files.new_manuals.length === 0) {
//     // console.log("update thiumbnails neveikia!!! Neatsiųstas joks failas");
//     return next();
//   }
//   req.thumbnailsData = [];
//   let originalFileName = null;
//   let finalThumbnailFileName;
//   let tempPdfPath = null;
//   let tempImagePath = null;
//   let thumbnailBuffer = null;

//   try {
//     for (const file of req.files.new_manuals) {
//       console.log("gauti failai", file);
//       originalFileName = file.originalname;
//       if (file.mimetype === "application/pdf") {
//         // Laikinas failo prefiksas
//         const pdfBuffer = file.buffer;
//         tempPdfPath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
//         fs.writeFileSync(tempPdfPath, pdfBuffer);

//         // Konvertuojame pirmą puslapį į JPEG su Poppler
//         finalThumbnailFileName = `thumb-${Date.now()}-${originalFileName.replace(
//           /\.[^/.]+$/,
//           ""
//         )}.jpg`;
//         const tempOutBase = path.join(os.tmpdir(), finalThumbnailFileName);
//         await poppler.pdfToCairo(tempPdfPath, tempOutBase, {
//           jpegFile: true,
//           firstPageToConvert: 1,
//           lastPageToConvert: 1,
//         });
//         // node-poppler sukuria `tempOutPath-1.jpg`
//         tempImagePath = `${tempOutBase}-1.jpg`;
//         console.log("tempImagePath", tempImagePath);
//         if (!fs.existsSync(tempImagePath)) {
//           throw new Error(
//             `Nepavyko sugeneruoti pirmo PDF puslapio: ${tempImagePath}`
//           );
//         }

//         // Resize su Sharp
//         thumbnailBuffer = await sharp(tempImagePath)
//           .resize(200, 200, {
//             fit: sharp.fit.inside,
//             withoutEnlargement: true,
//           })
//           .toFormat("jpeg", { quality: 80 })
//           // .toFile(thumbnailFilePath);
//           .toBuffer();

//         // console.log(`PDF įkeltas: ${finalThumbnailFileName}`);
//       } else {
//         throw new Error("Netikėtas failo tipas, kurio neapdorojo serveris.");
//       }

//       // Ištriname laikiną failą (jeigu buvo sukurtas PDF konvertavimo metu)
//       if (tempImagePath && fs.existsSync(tempImagePath)) {
//         fs.unlinkSync(tempPdfPath);
//         fs.unlinkSync(tempImagePath);
//         // console.log(`Laikinas failas ištrintas: ${tempImagePath}`);
//       }

//       req.thumbnailsData.push({
//         fieldname: "thumbnail",
//         thumbnailName: finalThumbnailFileName,
//         originalname: originalFileName,
//         encoding: "7bit",
//         mimetype: "image/jpeg",
//         buffer: thumbnailBuffer,
//         size: thumbnailBuffer.length,
//       });
//     }
//     // console.log("Čia veikia middleware", req.thumbnailsData);
//     return next();
//   } catch (error) {
//     console.error(
//       "Klaida apdorojant failą arba generuojant miniatiūrą:",
//       error
//     );

//     // Ištriname laikiną failą
//     if (tempImagePath && fs.existsSync(tempImagePath)) {
//       fs.unlink(tempImagePath, (err) => {
//         if (err) console.error("Klaida trinant laikiną failą:", err);
//       });
//     }
//     req.thumbnailsData = [];
//     res.status(500).json({
//       success: false,
//       message: `Klaida apdorojant failą: ${
//         error.message || "Nepavyko sugeneruoti miniatiūros."
//       }`,
//     });
//   }
// };

// Pataisyti
export const updateThumbnailsMiddleware = async (req, res, next) => {
  if (!req.files?.new_manuals?.length) {
    return next();
  }

  req.thumbnailsData = [];

  for (const file of req.files.new_manuals) {
    let tempPdfPath = null;
    let tempImagePath = null;

    try {
      if (file.mimetype !== "application/pdf") {
        throw new Error("Netinkamas failo tipas (tik PDF palaikomi)");
      }

      /* -------------------------------
         1. Išsaugome PDF į TEMP
      -------------------------------- */
      const timestamp = Date.now();
      const baseName = path.parse(file.originalname).name;

      tempPdfPath = path.join(os.tmpdir(), `upload-${timestamp}.pdf`);
      fs.writeFileSync(tempPdfPath, file.buffer);

      /* -------------------------------
         2. Generuojame PDF → JPG
      -------------------------------- */
      const outBase = path.join(os.tmpdir(), `thumb-${timestamp}-${baseName}`);

      await poppler.pdfToCairo(tempPdfPath, outBase, {
        jpegFile: true,
        firstPageToConvert: 1,
        lastPageToConvert: 1,
      });

      /* -------------------------------
         3. Randame sugeneruotą JPG
      -------------------------------- */
      const tmpFiles = fs.readdirSync(os.tmpdir());
      const generated = tmpFiles.find(
        (f) => f.startsWith(path.basename(outBase)) && f.endsWith(".jpg")
      );

      if (!generated) {
        throw new Error("PDF miniatiūra nesugeneruota");
      }

      tempImagePath = path.join(os.tmpdir(), generated);

      /* -------------------------------
         4. Resize su Sharp
      -------------------------------- */
      const thumbnailBuffer = await sharp(tempImagePath)
        .resize(200, 200, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const finalThumbnailName = `thumb-${timestamp}-${baseName}.jpg`;

      req.thumbnailsData.push({
        fieldname: "thumbnail",
        thumbnailName: finalThumbnailName,
        originalname: file.originalname,
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: thumbnailBuffer,
        size: thumbnailBuffer.length,
      });
    } catch (error) {
      console.error("Thumbnail middleware error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Nepavyko sugeneruoti PDF miniatiūros",
        details: error.message,
      });
    } finally {
      /* -------------------------------
         5. Valome TEMP failus
      -------------------------------- */
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }

      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    }
  }

  next();
};
export const createThumbnailsMiddleware = async (req, res, next) => {
  if (!req.files?.manual?.length) {
    return next();
  }

  req.thumbnailsData = [];

  for (const file of req.files.manual) {
    let tempPdfPath = null;
    let tempImagePath = null;

    try {
      if (file.mimetype !== "application/pdf") {
        throw new Error("Netinkamas failo tipas (tik PDF palaikomi)");
      }

      /* -------------------------------
         1. PDF → TEMP
      -------------------------------- */
      const timestamp = Date.now();
      const baseName = path.parse(file.originalname).name;

      tempPdfPath = path.join(os.tmpdir(), `upload-${timestamp}.pdf`);
      fs.writeFileSync(tempPdfPath, file.buffer);

      /* -------------------------------
         2. PDF → JPG (pirmas puslapis)
      -------------------------------- */
      const outBase = path.join(os.tmpdir(), `thumb-${timestamp}-${baseName}`);

      await poppler.pdfToCairo(tempPdfPath, outBase, {
        jpegFile: true,
        firstPageToConvert: 1,
        lastPageToConvert: 1,
      });

      /* -------------------------------
         3. Randame sugeneruotą JPG
      -------------------------------- */
      const tmpFiles = fs.readdirSync(os.tmpdir());
      const generated = tmpFiles.find(
        (f) => f.startsWith(path.basename(outBase)) && f.endsWith(".jpg")
      );

      if (!generated) {
        throw new Error("PDF miniatiūra nesugeneruota");
      }

      tempImagePath = path.join(os.tmpdir(), generated);

      /* -------------------------------
         4. Resize su Sharp
      -------------------------------- */
      const thumbnailBuffer = await sharp(tempImagePath)
        .resize(200, 200, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const finalThumbnailName = `thumb-${timestamp}-${baseName}.jpg`;

      req.thumbnailsData.push({
        fieldname: "thumbnail",
        thumbnailName: finalThumbnailName,
        originalname: file.originalname,
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: thumbnailBuffer,
        size: thumbnailBuffer.length,
      });
    } catch (error) {
      console.error("Thumbnail middleware error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Nepavyko sugeneruoti PDF miniatiūros",
        details: error.message,
      });
    } finally {
      /* -------------------------------
         5. TEMP valymas
      -------------------------------- */
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }

      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    }
  }

  next();
};
