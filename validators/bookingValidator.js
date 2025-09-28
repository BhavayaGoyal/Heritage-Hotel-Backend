const Joi = require("joi");

const bookingSchema = Joi.object({
    customerId: Joi.string().trim().required().messages({
        "string.base":"Customer ID must be a string",
        "string.empty":"Customer Id is required",
        "any.requires":"Customer Id is required"
    }),

    serviceCategory: Joi.string().trim().valid("room", "hall", "restaurant", "extra_services").required().messages({
        "any.only":"Service type must be out of one: room, hall, restaurant, extra_services.",
        "string.empty":"Service type is required",
        "any.required":"Service type is required"
    }),

    serviceId: Joi.string().trim().required().messages({
        "string.base":"Service Id must be a string",
        "any.required":"Service id is required",
        "string.empty":"Service id is required"
    }),

    date: Joi.date().iso().required().messages({
        "date.base":"Date must be in YYYY/MM/DD Format",
        "any.required":"Date required"
    }),

    time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
        "string.pattern.base":"Time must be in HH:MM format (e.g., 14: 30)",
        "string.empty":"Time is required",
        "any.required":"Time is required"
    }),

    status:Joi.string().valid("Pending", "Confirmed", "Cancelled").default("Pending").messages({
        "any.only":"Status must be pending, confirmed or cancelled"
    }),

    numberOfGuests: Joi.number().integer().min(1).max(500).required().messages({
        "number.base": "Number of guests must be a number",
        "number.min": "Number of guests must be at least 1",
        "number.max": "Number of guests must not exceed 500",
        "any.required": "Number of guests is required"
    })
});

exports.validateCreateBooking = (data) =>
  bookingSchema.validate(data, { abortEarly: false });

exports.validateUpdateBooking = (data) =>
  bookingSchema.fork(Object.keys(bookingSchema.describe().keys), (schema) =>
    schema.optional()
  ).validate(data, { abortEarly: false });