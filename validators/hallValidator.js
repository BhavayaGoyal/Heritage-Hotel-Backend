import Joi from "joi";

export const hallSchema = Joi.object({
    hallId: Joi.string().required(),
    name: Joi.string().required(),
    capacity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(1).required()
})

export const updateHallSchema = Joi.object({
    hallId: Joi.string().optional(),
    name: Joi.string().optional(),
    capacity: Joi.number().integer().min(1).optional(),
    price: Joi.number().min(1).optional()
})