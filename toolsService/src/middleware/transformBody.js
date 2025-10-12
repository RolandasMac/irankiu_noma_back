export async function transformBody(req, res, next) {
  req.body.description = req.body.description || [];
  req.body.images_urls = req.body.images_urls || [];
  req.body.price = req.body.price ? Number(req.body.price) : undefined;
  req.body.depozit = req.body.depozit ? Number(req.body.depozit) : undefined;
  req.body.rented = req.body.rented === "on";
  req.body.rented_until = req.body.rented_until
    ? new Date(req.body.rented_until)
    : null;
  console.log(req.body);
  next();
}
