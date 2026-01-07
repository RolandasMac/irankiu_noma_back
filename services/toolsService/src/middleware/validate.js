import Joi from "joi";

export function validateBody(schema) {
  console.log("validateBody");
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      // console.log("error", error);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}
