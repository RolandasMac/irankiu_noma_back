const express = require("express");
const multer = require("multer");
const path = require("path");
const { templatesDir } = require("../config/paths");
const controller = require("../controllers/docController");

const router = express.Router();

// Multer storage for templates
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, templatesDir);
  },
  filename: function (req, file, cb) {
    // keep original name or unique prefix
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/templates/upload", upload.single("template"), controller.uploadTemplate);
router.get("/templates", controller.getTemplates);
router.post("/documents/generate", express.json({ limit: "2mb" }), controller.generateDocument);

module.exports = router;
