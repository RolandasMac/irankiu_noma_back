export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: "Not Found" });
}

export function errorHandler(err, req, res, next) {
  // console.error("❌ Error:", err, err.status);
  // res.status(200).json({ success: false, message: err.message });
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}
