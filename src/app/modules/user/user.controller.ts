/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from './user.interface';
import { UserService } from './user.service';

const createCustomer: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { customer, ...userData } = req.body;
    const result = await UserService.createCustomer(customer, userData);

    sendResponse<IUser>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'user created successfully!',
      data: result,
    });
  },
);

const createAdmin: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { admin, ...userData } = req.body;
    const result = await UserService.createAdmin(admin, userData);

    sendResponse<IUser>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin created successfully!',
      data: result,
    });
  },
);
const createAdminFromCustomer: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { customerId } = req.params as any;
    const result = await UserService.createAdminFromCustomer(customerId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin created successfully!',
      data: result,
    });
  },
);

export const UserController = {
  createCustomer,
  createAdmin,
  createAdminFromCustomer,
};
