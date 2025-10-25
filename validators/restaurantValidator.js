const Joi = require("joi");

const restaurantSchema = Joi.object({
  _id: Joi.string().required(),
  name: Joi.string().required(),
  cuisineType: Joi.string().required(),
  location: Joi.string().required(),
  contact: Joi.object({
    phone: Joi.string().required(),
    email: Joi.string().email().required()
  }).required(),
  capacity: Joi.number().integer().positive().required(),
  facilities: Joi.array().items(Joi.string()).optional(),
  signatureDish: Joi.string().optional()
});

const updateRestaurantSchema = Joi.object({
  _id: Joi.string().optional(),
  name: Joi.string().optional(),
  cuisineType: Joi.string().optional(),
  location: Joi.string().optional(),
  contact: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional()
  }).optional(),
  capacity: Joi.number().integer().positive().optional(),
  facilities: Joi.array().items(Joi.string()).optional(),
  signatureDish: Joi.string().optional()
});
module.exports = { restaurantSchema, updateRestaurantSchema };
