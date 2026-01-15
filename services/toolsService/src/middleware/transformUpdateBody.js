export async function transformUpdateBody(req, res, next) {
  try {
    req.body.toolName = req.body.toolName;

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

    req.body.required_addons =
      req.body.required_addons !== ""
        ? !Array.isArray(req.body.required_addons)
          ? [req.body.required_addons]
          : req.body.required_addons
        : [];

    if (typeof req.body.current_manuals === "string") {
      try {
        const parsed = JSON.parse(req.body.current_manuals);
        req.body.current_manuals =
          parsed && Array.isArray(parsed) ? [...parsed] : [parsed];
      } catch (err) {
        console.error("Invalid JSON in current_manuals", err);
        req.body.current_manuals = [];
      }
    } else if (!Array.isArray(req.body.current_manuals)) {
      req.body.current_manuals = [];
    }

    console.log("🔄 Transformed body:2", req.body.current_manuals);

    next();
  } catch (error) {
    // console.error("Transform body error:", error);
    res.status(400).json({
      success: false,
      message: "Invalid request data",
    });
  }
}
