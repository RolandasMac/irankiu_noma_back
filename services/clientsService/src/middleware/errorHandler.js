export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: "Not Found" });
}

export function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}
