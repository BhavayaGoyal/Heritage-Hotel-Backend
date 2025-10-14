const Joi = require("joi");

const promotionSchema = Joi.object({
    promotionId: Joi.string().optional(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    discountType: Joi.string().valid("percentage", "flat").required(),
  discountValue: Joi.number().min(1).required(),
  validFrom: Joi.date().required(),
  validTo: Joi.date().required(),
  applicableCategories: Joi.array().items(Joi.string().valid("room", "hall", "service")).required(),
  promoCode: Joi.string().required(),
  status: Joi.string().valid("active", "inactive", "expired").default("active"),
  createdAt: Joi.date().default(() => new Date()),
});

const validatePromotion = (req, res, next) => {
  const { error } = promotionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validatePromotion };