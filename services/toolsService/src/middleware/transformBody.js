export async function transformBody(req, res, next) {
  req.body.toolName = req.body.toolName || "";
  req.body.signs = req.body.signs || "";
  req.body.description = req.body.description || [];
  req.body.images_urls = req.body.images_urls || [];
  req.body.toolPrice = req.body.toolPrice
    ? Number(req.body.toolPrice)
    : undefined;
  req.body.rentPrice = req.body.rentPrice
    ? Number(req.body.rentPrice)
    : undefined;
  req.body.depozit = req.body.depozit ? Number(req.body.depozit) : undefined;
  req.body.rented = req.body.rented === "on";
  req.body.rented_until = req.body.rented_until
    ? new Date(req.body.rented_until)
    : null;
  req.body.group = req.body.group;
  req.body.required_addons =
    typeof req.body.required_addons === "string" &&
    req.body.required_addons !== ""
      ? [req.body.required_addons]
      : req.body.required_addons || [];
  next();
}
