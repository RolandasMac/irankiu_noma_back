import path from "path";
import fs from "fs";
import paths from "../../../../config/paths.js";
import { Poppler } from "node-poppler";
import sharp from "sharp";
import os from "os";

const poppler = new Poppler();
const { thumbnailsDir, toolManualsDir } = paths;

export const createThumbnailsArrayMiddleware = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        "Nepavyko įkelti failų. Įsitikinkite, kad tai paveikslėliai ar PDF dokumentai.",
    });
  }
  // req.files.forEach(async (file) =>
  req.thumbnailsData = [];
  console.log("Files", req.files);

  for (const file of req.files) {
    const originalFilePath = file.path;
    const originalFileName = file.filename;
    let finalThumbnailFileName;
    let tempImagePath = null; // Laikinas kelias PDF konvertavimui

    try {
      if (file.mimetype.startsWith("manual/")) {
        // Apdorojame vaizdo failus su Sharp
        finalThumbnailFileName = `thumb-${originalFileName}`;
        const thumbnailFilePath = path.join(
          thumbnailsDir,
          finalThumbnailFileName
        );

        await sharp(originalFilePath)
          .resize(200, 200, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          .toFormat("jpeg", { quality: 80 })
          .toFile(thumbnailFilePath);

        console.log(`Failas įkeltas: ${originalFileName}`);
        console.log(`Miniatiūra sugeneruota: ${finalThumbnailFileName}`);
      } else if (file.mimetype === "application/pdf") {
        console.log("mimetype suveikė", file.mimetype);
        // Apdorojame PDF failus su pdf-poppler ir Sharp
        // const poppler = new Poppler();

        // Laikinas pavadinimas Poppler generuojamam paveikslėliui
        // pdf-poppler prideda '-1' už pirmo puslapio, pvz., 'temp-pdf-thumb-12345-1.jpg'
        const tempOutFilenameBase = `temp-pdf-thumb-${Date.now()}`;
        const tempOutPath = path.join(thumbnailsDir, tempOutFilenameBase);

        // const pdfToImageOptions = {
        //   firstPage: 1, // Konvertuojame tik pirmą puslapį
        //   lastPage: 1,
        //   format: "jpeg", // Poppler išveda JPEG formatu
        //   scale: 1000, // Didelė skalė, kad gautume geresnę pradinę kokybę prieš Sharp dydžio keitimą
        //   outdir: thumbnailsDir, // Išvesties katalogas
        //   outprefix: tempOutFilenameBase, // Išvesties failo prefiksas
        // };

        // ************************************
        let opts = {
          format: "jpeg",
          out_dir: thumbnailsDir,
          out_prefix: tempOutFilenameBase,
          page: 1,
        };

        await Poppler.convert(originalFilePath, opts)
          .then((res) => {
            console.log("Successfully converted");
          })
          .catch((error) => {
            console.error(error);
          });

        // *********************************

        // Konvertuojame PDF į paveikslėlį
        // await poppler.pdfToImage(originalFilePath, pdfToImageOptions);
        tempImagePath = `${tempOutPath}-1.jpg`; // Pilnas kelias prie Poppler sugeneruoto paveikslėlio
        console.log("Čia dar veikia", tempImagePath);
        // Dabar naudojame Sharp, kad standartizuotume miniatiūros dydį ir pavadinimą
        finalThumbnailFileName = `thumb-${originalFileName.replace(
          /\.[^/.]+$/,
          ""
        )}.jpg`; // Pakeičiame plėtinį į .jpg
        const thumbnailFilePath = path.join(
          thumbnailsDir,
          finalThumbnailFileName
        );

        await sharp(tempImagePath)
          .resize(200, 200, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          .toFormat("jpeg", { quality: 80 })
          .toFile(thumbnailFilePath);

        console.log(`PDF įkeltas: ${originalFileName}`);
        console.log(`PDF miniatiūra sugeneruota: ${finalThumbnailFileName}`);
      } else {
        // Tai neturėtų įvykti, jei fileFilter veikia tinkamai.
        throw new Error("Netikėtas failo tipas, kurio neapdorojo serveris.");
      }

      // Ištriname laikiną paveikslėlį, jei PDF buvo konvertuotas
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
        console.log(`Laikinas failas ištrintas: ${tempImagePath}`);
      }
      const thumbnailsData = {
        originalUrl: ``,
        thumbnailUrl: `/thumbnails/${finalThumbnailFileName}`,
        originalFileName: originalFileName,
        thumbnailFileName: finalThumbnailFileName,
      };
      req.thumbnailsData.push(thumbnailsData);
    } catch (error) {
      console.error(
        "Klaida apdorojant failą arba generuojant miniatiūrą:",
        error
      );

      // Ištriname įkeltą originalų failą, jei apdorojimas nepavyko
      fs.unlink(originalFilePath, (err) => {
        if (err)
          console.error(
            "Klaida trinant įkeltą failą po apdorojimo klaidos:",
            err
          );
      });

      // Ištriname laikiną paveikslėlį, jei jis buvo sukurtas ir įvyko klaida
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlink(tempImagePath, (err) => {
          if (err)
            console.error(
              "Klaida trinant laikiną failą po apdorojimo klaidos:",
              err
            );
        });
      }

      res.status(500).json({
        success: false,
        message: `Klaida apdorojant failą: ${
          error.message || "Nepavyko sugeneruoti miniatiūros."
        }`,
      });
    }
  }
  return next();
  res.json({
    success: true,
    message: "Failas sėkmingai įkeltas ir miniatiūra sugeneruota!",
    ...thumbnailsData,
  });
};
export const createThumbnailsMiddleware = async (req, res, next) => {
  console.log("Čia veikia", req.files.manual.length);
  if (req.files.manual.length === 0) {
    console.log("update thiumbnails neveikia!!! Neatsiųstas joks failas");
    return next();
  }

  try {
    req.thumbnailsData = [];
    for (const file of req.files.manual) {
      console.log("forEach");
      const originalFileName = file.originalname;
      let finalThumbnailFileName;
      let tempPdfPath = null;
      let tempImagePath = null;
      let thumbnailBuffer = null;
      if (file.mimetype === "application/pdf") {
        // Laikinas failo prefiksas
        const pdfBuffer = file.buffer;
        tempPdfPath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
        fs.writeFileSync(tempPdfPath, pdfBuffer);

        // Konvertuojame pirmą puslapį į JPEG su Poppler
        finalThumbnailFileName = `thumb-${Date.now()}-${originalFileName.replace(
          /\.[^/.]+$/,
          ""
        )}.jpg`;
        const tempOutBase = path.join(os.tmpdir(), finalThumbnailFileName);
        await poppler.pdfToCairo(tempPdfPath, tempOutBase, {
          jpegFile: true,
          firstPageToConvert: 1,
          lastPageToConvert: 1,
        });
        // node-poppler sukuria `tempOutPath-1.jpg`
        tempImagePath = `${tempOutBase}-1.jpg`;

        if (!fs.existsSync(tempImagePath)) {
          throw new Error(
            `Nepavyko sugeneruoti pirmo PDF puslapio: ${tempImagePath}`
          );
        }

        // Resize su Sharp
        thumbnailBuffer = await sharp(tempImagePath)
          .resize(200, 200, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          .toFormat("jpeg", { quality: 80 })
          // .toFile(thumbnailFilePath);
          .toBuffer();

        console.log(`PDF įkeltas: ${finalThumbnailFileName}`);
      } else {
        throw new Error("Netikėtas failo tipas, kurio neapdorojo serveris.");
      }

      // Ištriname laikiną failą (jeigu buvo sukurtas PDF konvertavimo metu)
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempPdfPath);
        fs.unlinkSync(tempImagePath);
        console.log(`Laikinas failas ištrintas: ${tempImagePath}`);
      }

      req.thumbnailsData.push({
        fieldname: "thumbnail",
        thumbnailName: finalThumbnailFileName,
        originalname: originalFileName,
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: thumbnailBuffer,
        size: thumbnailBuffer.length,
      });
    }
    console.log("Čia veikia middleware", req.thumbnailsData);
    return next();
  } catch (error) {
    console.error(
      "Klaida apdorojant failą arba generuojant miniatiūrą:",
      error
    );

    // Ištriname įkeltą originalą
    fs.unlink(originalFilePath, (err) => {
      if (err) console.error("Klaida trinant įkeltą failą:", err);
    });

    // Ištriname laikiną failą
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlink(tempImagePath, (err) => {
        if (err) console.error("Klaida trinant laikiną failą:", err);
      });
    }

    res.status(500).json({
      success: false,
      message: `Klaida apdorojant failą: ${
        error.message || "Nepavyko sugeneruoti miniatiūros."
      }`,
    });
  }
};
export const updateThumbnailsMiddleware = async (req, res, next) => {
  console.log("update thiumbnails veikia!!!");
  if (!req.files.manual) {
    console.log("update thiumbnails neveikia!!! Neatsiųstas joks failas");
    return next();
  }

  try {
    const originalFileName = req.files.manual[0].originalname;
    let finalThumbnailFileName;
    let tempPdfPath = null;
    let tempImagePath = null;
    let thumbnailBuffer = null;
    if (req.files.manual[0].mimetype === "application/pdf") {
      // Laikinas failo prefiksas
      const pdfBuffer = req.files.manual[0].buffer;
      tempPdfPath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Konvertuojame pirmą puslapį į JPEG su Poppler
      finalThumbnailFileName = `thumb-${Date.now()}-${originalFileName.replace(
        /\.[^/.]+$/,
        ""
      )}.jpg`;
      const tempOutBase = path.join(os.tmpdir(), finalThumbnailFileName);
      await poppler.pdfToCairo(tempPdfPath, tempOutBase, {
        jpegFile: true,
        firstPageToConvert: 1,
        lastPageToConvert: 1,
      });
      // node-poppler sukuria `tempOutPath-1.jpg`
      tempImagePath = `${tempOutBase}-1.jpg`;

      if (!fs.existsSync(tempImagePath)) {
        throw new Error(
          `Nepavyko sugeneruoti pirmo PDF puslapio: ${tempImagePath}`
        );
      }

      // Normalizuojame miniatiūros pavadinimą
      // finalThumbnailFileName = `thumb-${Date.now()}-${originalFileName.replace(
      //   /\.[^/.]+$/,
      //   ""
      // )}.jpg`;
      // thumbnailFilePath = path.join(thumbnailsDir, finalThumbnailFileName);

      // Resize su Sharp
      thumbnailBuffer = await sharp(tempImagePath)
        .resize(200, 200, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .toFormat("jpeg", { quality: 80 })
        // .toFile(thumbnailFilePath);
        .toBuffer();

      // console.log(`PDF įkeltas: ${originalFileName}`);
      // console.log(`PDF miniatiūra sugeneruota: ${finalThumbnailFileName}`);
      console.log(`PDF įkeltas: ${finalThumbnailFileName}`);
    } else {
      throw new Error("Netikėtas failo tipas, kurio neapdorojo serveris.");
    }

    // Ištriname laikiną failą (jeigu buvo sukurtas PDF konvertavimo metu)
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempPdfPath);
      fs.unlinkSync(tempImagePath);
      console.log(`Laikinas failas ištrintas: ${tempImagePath}`);
    }

    // const thumbnailsData = {
    //   originalUrl: `/${toolManualsDir}/${originalFileName}`,
    //   thumbnailUrl: thumbnailFilePath,
    //   originalFileName,
    //   thumbnailFileName: finalThumbnailFileName,
    // };

    // req.body.manual_url = thumbnailsData.originalUrl;
    // req.body.manualThumbnail_url = thumbnailFilePath;

    req.thumbnailsData = {
      fieldname: "thumbnail",
      originalname: finalThumbnailFileName,
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: thumbnailBuffer,
      size: thumbnailBuffer.length,
    };
    console.log("Thumbnails", req.thumbnailsData);
    return;
    return next();
  } catch (error) {
    console.error(
      "Klaida apdorojant failą arba generuojant miniatiūrą:",
      error
    );

    // Ištriname įkeltą originalą
    fs.unlink(originalFilePath, (err) => {
      if (err) console.error("Klaida trinant įkeltą failą:", err);
    });

    // Ištriname laikiną failą
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlink(tempImagePath, (err) => {
        if (err) console.error("Klaida trinant laikiną failą:", err);
      });
    }

    res.status(500).json({
      success: false,
      message: `Klaida apdorojant failą: ${
        error.message || "Nepavyko sugeneruoti miniatiūros."
      }`,
    });
  }
};
