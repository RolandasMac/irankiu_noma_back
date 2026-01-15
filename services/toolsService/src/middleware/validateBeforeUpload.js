export function validateBeforeUpload(schema) {
  return (req, res, next) => {
    // console.log("🔄 Starting pre-upload validation...");
    // console.log("Veikia", req.body.required_addons);
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      // console.log("❌ Pre-upload validation failed:", error.details);
      return res.status(400).json({
        success: false,
        message: "Validacijos klaida Before Upload",
        details: error.details.map((d) => d.message),
      });
    }

    req.body = value;
    // console.log("✅ Pre-upload validation passed");
    next();
  };
}
