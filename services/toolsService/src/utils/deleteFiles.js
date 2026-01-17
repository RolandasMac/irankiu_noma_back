import fs from "fs";
import path from "path";

/**
 * Pašalina manuals ir jų thumbnails iš failų sistemos
 */
// export function deleteManualsAndThumbnails(
//   manualsUrls,
//   manualsDir,
//   thumbnailsDir
// ) {
//   if (!Array.isArray(manualsUrls)) return;

//   for (const manual of manualsUrls) {
//     // 🔹 Manual PDF
//     if (manual.manualFilename) {
//       const manualPath = path.join(
//         manualsDir,
//         path.basename(manual.manualFilename)
//       );

//       try {
//         if (fs.existsSync(manualPath)) {
//           fs.unlinkSync(manualPath);
//           console.log(`[DELETE] Manual ištrintas: ${manualPath}`);
//         } else {
//           console.warn(`[WARN] Manual nerastas: ${manualPath}`);
//         }
//       } catch (err) {
//         console.error(`[ERROR] Klaida trinant manual ${manualPath}:`, err);
//       }
//     }

//     // 🔹 Thumbnail
//     if (manual.thumbnailFilename) {
//       const thumbnailPath = path.join(
//         thumbnailsDir,
//         path.basename(manual.thumbnailFilename)
//       );

//       try {
//         if (fs.existsSync(thumbnailPath)) {
//           fs.unlinkSync(thumbnailPath);
//           console.log(`[DELETE] Thumbnail ištrintas: ${thumbnailPath}`);
//         } else {
//           console.warn(`[WARN] Thumbnail nerastas: ${thumbnailPath}`);
//         }
//       } catch (err) {
//         console.error(
//           `[ERROR] Klaida trinant thumbnail ${thumbnailPath}:`,
//           err
//         );
//       }
//     }
//   }
// }

export function deleteFile(fileDir, fileUrl) {
  // Jei saugomas pilnas kelias arba tik failo pavadinimas
  const filename = path.basename(fileUrl);
  const filePath = path.join(fileDir, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[DELETE] Deleted file: ${filePath}`);
    } else {
      console.warn(`[WARN] File not found: ${filePath}`);
    }
  } catch (err) {
    console.error(`[ERROR] Error deleting file ${filePath}:`, err);
  }
}
