const Joi = require("joi");

const roomDetailsValidator = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    price: Joi.number().min(0).optional(),
    totalRooms: Joi.number().integer().min(0).optional(),
    occupancy: Joi.number().integer().min(1).optional(),
    availability: Joi.string().valid("true","false").optional(),
});

const roomAvailabilityValidator = Joi.object({
    roomId: Joi.string().required(),
    count: Joi.number().integer().required(),
});

module.exports = {
    roomDetailsValidator,
    roomAvailabilityValidator
}