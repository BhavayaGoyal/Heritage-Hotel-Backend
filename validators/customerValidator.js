const Joi = require("joi");

const customerSchema = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
        "string.base": "Name must be a string",
        "string.empty": "Name is required",
        "string.min": "NAme must be at least 3 characters long",
        "any.required":"NAme is required"
    }),

    email: Joi.string().email().required().messages({
        "string.base":"Email must be a string",
        "string.empty": "Email is required",
        "string.email": "Invalid email format",
        "any.required": "Email is required"
    }),

    phone: Joi.string()
    .pattern(/^\+91\s?[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone must be in +91 9876543210 format",
      "any.required": "Phone is required"
    }),

  address: Joi.string().min(5).max(200).required().messages({
    "string.base": "Address must be a string",
    "string.empty": "Address is required",
    "string.min": "Address must be at least 5 characters long",
    "any.required": "Address is required"
  }),

  idProof: Joi.string().required().messages({
    "string.base": "ID Proof must be a string",
    "string.empty": "ID Proof is required",
    "any.required": "ID Proof is required"
  }),

  nationality: Joi.string().required().messages({
    "string.base": "Nationality must be a string",
    "string.empty": "Nationality is required",
    "any.required": "Nationality is required"
  })

});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{7,15}$/)
    .optional(),
  address: Joi.string().max(200).optional(),
  idProof: Joi.string().optional(),
  nationality: Joi.string().optional()
}).min(1);

function validateCustomer(data){
    return customerSchema.validate(data, {abortEarly: false});
}
const validateUpdateCustomer = (data) => updateCustomerSchema.validate(data, {abortEarly: false});

module.exports = {validateCustomer, validateUpdateCustomer};