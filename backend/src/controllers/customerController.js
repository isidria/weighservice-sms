import { Customer } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, company, notes } = req.body;

    if (!name || !phone) {
      throw new AppError('Name and phone are required', 400);
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      company,
      notes,
    });

    res.status(201).json({
      success: true,
      data: customer,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll();

    res.json({
      success: true,
      data: customers,
      count: customers.length,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.json({
      success: true,
      data: customer,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const customer = await Customer.update(id, data);

    res.json({
      success: true,
      data: customer,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.delete(id);

    res.json({
      success: true,
      data: customer,
      message: 'Customer deleted',
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
