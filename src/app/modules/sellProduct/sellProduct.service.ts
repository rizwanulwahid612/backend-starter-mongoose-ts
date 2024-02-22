/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SortOrder, Types } from 'mongoose';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';

import {
  ISellProduct,
  ISellProductFilterRequest,
} from './sellProduct.interface';
import { SellproductSearchableFields } from './sellProduct.constant';
import { SellProducts } from './sellProduct.model';
import { InventoryProducts } from '../addIntoInventory/addIntoInventory.model';
import { IinventoryProduct } from '../addIntoInventory/addIntoInventory.interface';

type IUserInfo = {
  userName: string;
  userEmail: string;
  userImage: string;
};

const getAllSellProducts = async (
  filters: ISellProductFilterRequest,
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<ISellProduct[]>> => {
  const { searchTerm, ...filtersData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];

  // Search needs $or for searching in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: SellproductSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  // Filters needs $and to fullfill all the conditions
  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  // Dynamic sort needs  fields to  do sorting
  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }

  // If there is no condition , put {} to give all data
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await SellProducts.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await SellProducts.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};
type IdataInven = {
  userInfo: IUserInfo;
  image: string;
  name: string;
  price: string;
  occation: string;
  recipient: string;
  category: string;
  theme: string;
  brand: string;
  color: string;
  quantity: 1;
};

const addSingleSellProduct = async (
  id: string,
  dataInven: IdataInven,
): Promise<any> => {
  // Find the booking by ID
  const SellInventoryProduct = await InventoryProducts.findOne({
    _id: new Types.ObjectId(id),
  });

  console.log('SellInventoryProduct:', SellInventoryProduct);
  if (SellInventoryProduct) {
    const existingProduct = await SellProducts.findOne({
      'userInfo.userEmail': SellInventoryProduct.userInfo.userEmail,
      name: SellInventoryProduct.name,
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of current day
        $lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of current day
      },
    });
    const updated2 = {
      ...SellInventoryProduct?.toObject(),
      quantity: SellInventoryProduct.quantity! - 1,
    };

    if (existingProduct) {
      // Product already exists, update quantity
      const updatedProduct = {
        ...existingProduct.toObject(),
        quantity: existingProduct.quantity! + 1,
      };
      const result = await SellProducts.findOneAndUpdate(
        { _id: existingProduct._id },
        updatedProduct,
        { new: true },
      );
      await InventoryProducts.findOneAndUpdate(
        { _id: SellInventoryProduct._id },
        updated2,
        { new: true },
      );
      //@ts-ignore
      if (SellInventoryProduct.quantity <= 1) {
        await InventoryProducts.findOneAndDelete({ _id: id });
      }
      console.log('Updated product:', result);
      return result;
    } else {
      const result = await SellProducts.create(dataInven);
      console.log('Added new Sell product:', result);

      await InventoryProducts.findOneAndUpdate(
        { _id: SellInventoryProduct._id },
        updated2,
        { new: true },
      );
      //@ts-ignore
      if (SellInventoryProduct.quantity <= 1) {
        await InventoryProducts.findOneAndDelete({ _id: id });
      }
      return result;
    }
  }
};

const addSingleDuplicateProduct = async (
  id: string,
  data: IinventoryProduct,
): Promise<any> => {
  // Find the booking by ID
  const duplicateProduct = await InventoryProducts.findOne({
    _id: new Types.ObjectId(id),
  });
  console.log('addSingleDuplicateProduct:', duplicateProduct);
  const result = await InventoryProducts.create(data);
  return result;
};
const getSingleSellProduct = async (
  id: string,
): Promise<ISellProduct | null> => {
  const result = await SellProducts.findOne({ _id: id });
  return result;
};

// const deleteSingleEnventoryProduct = async (
//   id: string,
// ): Promise<IinventoryProduct | null> => {
//   const service = await InventoryProducts.findOneAndDelete({ _id: id });
//   return service;
// };

export const SellProductsService = {
  getAllSellProducts,
  getSingleSellProduct,
  addSingleSellProduct,
  addSingleDuplicateProduct,
  //deleteSingleEnventoryProduct,
};
