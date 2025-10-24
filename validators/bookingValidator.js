const Joi = require("joi");

const bookingSchema = Joi.object({
  customerId: Joi.string().trim().optional().messages({
    "string.base": "Customer ID must be a string",
  }),

  serviceCategory: Joi.string().trim().valid("room", "hall", "restaurant", "service").required().messages({
    "any.only": "Service type must be one of: room, hall, restaurant, service",
    "string.empty": "Service type is required",
    "any.required": "Service type is required",
  }),

  serviceId: Joi.string().trim().required().messages({
    "string.base": "Service Id must be a string",
    "string.empty": "Service id is required",
    "any.required": "Service id is required",
  }),

  bookingDate: Joi.date().iso().required().messages({
    "date.base": "Booking date must be in YYYY-MM-DD format",
    "any.required": "Booking date is required",
  }),

  bookingTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    "string.pattern.base": "Booking time must be in HH:MM format (24-hour)",
    "string.empty": "Booking time is required",
    "any.required": "Booking time is required",
  }),

  status: Joi.string().valid("pending", "confirmed", "cancelled").default("confirmed").messages({
    "any.only": "Status must be pending, confirmed or cancelled",
  }),

  numberOfGuests: Joi.number().integer().min(1).max(500).default(1).messages({
    "number.base": "Number of guests must be a number",
    "number.min": "Number of guests must be at least 1",
    "number.max": "Number of guests must not exceed 500",
  }),

  details: Joi.object({
    eventName: Joi.string().trim().allow("").default(""),
    durationDays: Joi.number().integer().min(1).default(1),
    specialRequest: Joi.string().trim().allow("").default(""),
  }).optional(),
});

exports.validateCreateBooking = (data) =>
  bookingSchema.validate(data, { abortEarly: false });

exports.validateUpdateBooking = (data) =>
  bookingSchema.fork(Object.keys(bookingSchema.describe().keys), (schema) =>
    schema.optional()
  ).validate(data, { abortEarly: false });
