export async function transformUpdateBody(req, res, next) {
  try {
    req.body.toolName = req.body.toolName || "";

    // Apdoroti signs kaip masyvą
    if (typeof req.body.signs === "string") {
      req.body.signs = req.body.signs
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    } else {
      req.body.signs = req.body.signs || [];
    }

    // Apdoroti description kaip masyvą
    if (typeof req.body.description === "string") {
      req.body.description = [req.body.description];
    } else if (Array.isArray(req.body.description)) {
      req.body.description = req.body.description.filter(
        (desc) => desc && desc.trim()
      );
    } else {
      req.body.description = [];
    }

    // Apdoroti existingImages ir deletedImages
    req.body.existingImages = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : req.body.existingImages
      ? [req.body.existingImages]
      : [];

    req.body.deletedImages = Array.isArray(req.body.deletedImages)
      ? req.body.deletedImages
      : req.body.deletedImages
      ? [req.body.deletedImages]
      : [];

    // Skaitiniai laukai
    req.body.toolPrice = req.body.toolPrice ? Number(req.body.toolPrice) : 0;
    req.body.rentPrice = req.body.rentPrice ? Number(req.body.rentPrice) : 0;
    req.body.depozit = req.body.depozit ? Number(req.body.depozit) : 0;

    // Boolean ir datos laukai
    req.body.rented = req.body.rented === "on" || req.body.rented === "true";
    req.body.rented_until = req.body.rented_until
      ? new Date(req.body.rented_until)
      : null;

    console.log("🔄 Transformed body:", {
      toolName: req.body.toolName,
      description: req.body.description,
      toolPrice: req.body.toolPrice,
      rentPrice: req.body.rentPrice,
      existingImages: req.body.existingImages?.length,
      deletedImages: req.body.deletedImages?.length,
    });

    next();
  } catch (error) {
    console.error("Transform body error:", error);
    res.status(400).json({
      success: false,
      message: "Invalid request data",
    });
  }
}
