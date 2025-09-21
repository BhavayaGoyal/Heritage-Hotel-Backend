const Joi = require('joi');

const signupValidator = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('customer', 'admin', 'receptionist').required(),
    phone:Joi.string().min(10).max(15).required()
});

const loginValidator = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

module.exports = {signupValidator, loginValidator};