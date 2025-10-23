// import { db } from "~/utils/db.server"; // arba tavo Mongo jungties modulis
import Counter from "../models/Counter.js";
// Gauti numerio formatą iš ENV su numatytosiomis reikšmėmis
const FORMAT = process.env.DOC_NUMBER_FORMAT || "PREFIX-YEAR-NUMBER";
const PADDING = parseInt(process.env.DOC_NUMBER_PADDING || "4");
const DEFAULT_PREFIX = process.env.DOC_DEFAULT_PREFIX || "DOC";

/**
 * Sugeneruoja unikalų numerį pasirinktam dokumento tipui (pvz. sąskaita ar sutartis)
 * Pvz. INV-2025-0001, arba CON-25-0001, arba INV-0001 (pagal formatą)
 */
export async function getNextNumber(type) {
  const year = new Date().getFullYear();
  const shortYear = String(year).slice(-2);
  const counterId = `${type}_${year}`;

  // Patikrinam ar metų skaitiklis egzistuoja
  const existing = await Counter.collection("counters").findOne({
    _id: counterId,
  });

  if (!existing) {
    await Counter.collection("counters").insertOne({
      _id: counterId,
      type,
      year,
      lastNumber: 1,
    });
    return formatNumber(type, year, shortYear, 1);
  }

  // Atomic padidinimas – garantuoja unikalumą net keliems procesams
  const result = await Counter.collection("counters").findOneAndUpdate(
    { _id: counterId },
    { $inc: { lastNumber: 1 } },
    { returnDocument: "after" }
  );

  const num = result.value?.lastNumber ?? 1;
  return formatNumber(type, year, shortYear, num);
}

/**
 * Sudaro numerį pagal formatą iš ENV
 */
function formatNumber(type, year, shortYear, num) {
  const prefix = getPrefix(type);
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
function getPrefix(type) {
  switch (type) {
    case "invoice":
      return "INV";
    case "contract":
      return "CON";
    case "receipt":
      return "RCPT";
    default:
      return DEFAULT_PREFIX;
  }
}
