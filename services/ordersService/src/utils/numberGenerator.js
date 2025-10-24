// import { db } from "~/utils/db.server"; // arba tavo Mongo jungties modulis
import Counter from "../models/Counter.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// Gauti numerio formatą iš ENV su numatytosiomis reikšmėmis
const FORMAT = process.env.DOC_NUMBER_FORMAT || "PREFIX-YEAR-NUMBER";
const PADDING = parseInt(process.env.DOC_NUMBER_PADDING || "4");
const DEFAULT_PREFIX = process.env.DOC_DEFAULT_PREFIX || "DOC";

/**
 * Sugeneruoja unikalų numerį pasirinktam dokumento tipui (pvz. sąskaita ar sutartis)
 * Pvz. INV-2025-0001, arba CON-25-0001, arba INV-0001 (pagal formatą)
 */
// export async function getNextNumber(type) {
//   const year = new Date().getFullYear();
//   const shortYear = String(year).slice(-2);
//   const counterId = `${type}_${year}`;

//   // Patikrinam ar metų skaitiklis egzistuoja
//   const existing = await Counter.findOne({
//     id: counterId,
//   });

//   if (!existing) {
//     await Counter.create({
//       id: counterId,
//       type,
//       year,
//       lastNumber: 1,
//     });

//     return formatNumber(type, year, shortYear, 1);
//   }
//   // Atomic padidinimas – garantuoja unikalumą net keliems procesams
//   const result = await Counter.findOneAndUpdate(
//     { id: counterId },
//     { $inc: { lastNumber: 1 } },
//     { returnDocument: "after" }
//   );
//   console.log("result", result);
//   const num = result?.lastNumber ?? 1;
//   return formatNumber(type, year, shortYear, num);
// }

// /**
//  * Sudaro numerį pagal formatą iš ENV
//  */
// function formatNumber(type, year, shortYear, num) {
//   const prefix = getPrefix(type);
//   const padded = String(num).padStart(PADDING, "0");

//   switch (FORMAT) {
//     case "PREFIX-YEAR_SHORT-NUMBER":
//       return `${prefix}-${shortYear}-${padded}`;
//     case "PREFIX-NUMBER":
//       return `${prefix}-${padded}`;
//     case "PREFIX-YEAR-NUMBER":
//     default:
//       return `${prefix}-${year}-${padded}`;
//   }
// }

// /**
//  * Prefiksai pagal tipą (arba iš .env)
//  */
// function getPrefix(type) {
//   switch (type) {
//     case "invoice":
//       return "INV";
//     case "contract":
//       return "CON";
//     case "receipt":
//       return "RCPT";
//     default:
//       return DEFAULT_PREFIX;
//   }
// }

/**
 * Sugeneruoja unikalų numerį pasirinktam dokumento tipui (pvz. sąskaita ar sutartis),
 * pernaudodamas ištrintus numerius, jei tokių yra.
 * Pvz.: INV-2025-0001, CON-25-0001 ir pan.
 */
export async function getNextNumber(type) {
  const year = new Date().getFullYear();
  const shortYear = String(year).slice(-2);
  const counterId = `${type}_${year}`;

  // 1️⃣ Gauti arba sukurti Counter įrašą
  let counter = await Counter.findOne({ id: counterId });
  if (!counter) {
    counter = await Counter.create({
      id: counterId,
      type,
      year,
      lastNumber: 1,
      availableNumbers: [],
    });
    return formatNumber(type, year, shortYear, 1);
  }

  // 2️⃣ Bandome pernaudoti laisvą numerį (jei yra)
  // Naudojam atomic operaciją, kad dvi užklausos vienu metu nepaimtų to paties
  const reused = await Counter.findOneAndUpdate(
    { id: counterId, availableNumbers: { $exists: true, $ne: [] } },
    { $pop: { availableNumbers: -1 } }, // išima mažiausią (kairiausią) skaičių
    { returnDocument: "after" }
  );

  if (
    reused &&
    reused.availableNumbers &&
    reused.availableNumbers.length < counter.availableNumbers.length
  ) {
    // paskutinis išimtas numeris (pirmas masyve prieš atnaujinimą)
    const reusedNum = Math.min(...counter.availableNumbers);
    return formatNumber(type, year, shortYear, reusedNum);
  }

  // 3️⃣ Jei nėra laisvų numerių – padidinam lastNumber
  const updated = await Counter.findOneAndUpdate(
    { id: counterId },
    { $inc: { lastNumber: 1 } },
    { returnDocument: "after" }
  );

  const num = updated?.lastNumber ?? 1;
  return formatNumber(type, year, shortYear, num);
}

/**
 * Sukuria numerio tekstą pagal formatą iš .env
 */
function formatNumber(type, year, shortYear, num) {
  const FORMAT = process.env.DOC_NUMBER_FORMAT || "PREFIX-YEAR-NUMBER";
  const PADDING = parseInt(process.env.DOC_NUMBER_PADDING || "4");
  const DEFAULT_PREFIX = process.env.DOC_DEFAULT_PREFIX || "DOC";

  const prefix = getPrefix(type, DEFAULT_PREFIX);
  const padded = String(num).padStart(PADDING, "0");

  switch (FORMAT) {
    case "PREFIX-YEAR_SHORT-NUMBER":
      return `${prefix}-${shortYear}-${padded}`;
    case "PREFIX-NUMBER":
      return `${prefix}-${padded}`;
    case "PREFIX-YEAR-NUMBER":
    default:
      return `${prefix}-${year}-${padded}`;
  }
}

/**
 * Prefiksai pagal tipą (arba iš .env)
 */
function getPrefix(type, DEFAULT_PREFIX) {
  switch (type) {
    case "invoice":
      return "INV";
    case "contract":
      return "CON";
    case "receipt":
      return "RR";
    default:
      return DEFAULT_PREFIX;
  }
}
