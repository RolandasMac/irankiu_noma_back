require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const docsRouter = require("./routes/docsRouter");
const { templatesDir, generatedDir } = require("./config/paths");

const app = express();
app.use(cors());
app.use(morgan("dev"));

// ensure store dirs exist
[templatesDir, generatedDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// static to serve generated files if you like
app.use("/templates", express.static(templatesDir));
app.use("/generated", express.static(generatedDir));

// routes
app.use("/api", docsRouter);

const PORT = process.env.DOCX_PORT || 4001;
app.listen(PORT, () => console.log(`docx microservice listening on ${PORT}`));

