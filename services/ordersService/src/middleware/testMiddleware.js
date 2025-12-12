export async function testMiddleware(req, res, next) {
  const { id } = req.params;
  const body = req.body;
  console.log("testMiddleware", body, id);
  next();
}
