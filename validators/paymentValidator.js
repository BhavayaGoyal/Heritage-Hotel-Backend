const Joi = require('joi');

const paymentSchema = Joi.object({
    bookingId: Joi.string().required().messages({
        "any.required":"Booking ID is Required.",
        "string.base":"Booking Id must be a string"
    }),

    customerId: Joi.string().required().messages({
        "any.required":"Customer ID is required",
        "string.base":"Customer ID must be a string"
    }),
    roomIds:Joi.array().items(Joi.string()).optional(),
    hallIds:Joi.array().items(Joi.string()).optional(),
    serviceIds:Joi.array().items(Joi.string()).optional(),
    restaurantIds:Joi.array().items(Joi.string()).optional(),
    paymentMethod:Joi.string().valid("Cash", "Debit Card", "Credit Card","UPI", "Netbanking").required().messages({
        "any.required":"Payment Method is required",
        "any.only":"Payment method must be one of: Cash, Debit Card, UPI, Netbanking or Credit Card"
    }),
    promoCode: Joi.string().optional().messages({
        "string.base":"Promotion code must be a string"
    })
    
});

const paymentUpdateSchema = Joi.object({
  bookingId: Joi.string().optional(),
  roomIds: Joi.array().items(Joi.string()).optional(),
  hallIds: Joi.array().items(Joi.string()).optional(),
  serviceIds: Joi.array().items(Joi.string()).optional(),
  restaurantIds: Joi.array().items(Joi.string()).optional(),
  paymentMethod: Joi.string()
    .valid("Cash", "Debit Card", "Credit Card", "UPI", "Netbanking")
    .optional(),
  status: Joi.string().valid("paid", "pending", "refunded").optional()
});

module.exports={paymentSchema, paymentUpdateSchema};