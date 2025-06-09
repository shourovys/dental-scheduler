import { Document, FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';
import { AppError } from '../middleware/errorHandler';
import logger from './logger';

interface MongoError {
  code?: number;
  message: string;
}

export class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  protected async findOne(
    filter: FilterQuery<T>,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T | null> {
    try {
      return await this.model.findOne(filter, projection, options);
    } catch (error) {
      logger.error('Error in findOne:', { error, filter });
      throw new AppError('Error finding document', 500);
    }
  }

  protected async find(
    filter: FilterQuery<T>,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T[]> {
    try {
      return await this.model.find(filter, projection, options);
    } catch (error) {
      logger.error('Error in find:', { error, filter });
      throw new AppError('Error finding documents', 500);
    }
  }

  protected async create(data: Partial<T>): Promise<T> {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error: unknown) {
      logger.error('Error in create:', { error, data });
      if (this.isMongoError(error) && error.code === 11000) {
        throw new AppError('Duplicate entry', 400);
      }
      throw new AppError('Error creating document', 500);
    }
  }

  protected async update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    try {
      return await this.model.findOneAndUpdate(filter, update, options);
    } catch (error: unknown) {
      logger.error('Error in update:', { error, filter, update });
      if (this.isMongoError(error) && error.code === 11000) {
        throw new AppError('Duplicate entry', 400);
      }
      throw new AppError('Error updating document', 500);
    }
  }

  protected async delete(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOneAndDelete(filter);
    } catch (error) {
      logger.error('Error in delete:', { error, filter });
      throw new AppError('Error deleting document', 500);
    }
  }

  protected async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      return (await this.model.exists(filter)) !== null;
    } catch (error) {
      logger.error('Error in exists:', { error, filter });
      throw new AppError('Error checking document existence', 500);
    }
  }

  protected async count(filter: FilterQuery<T>): Promise<number> {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      logger.error('Error in count:', { error, filter });
      throw new AppError('Error counting documents', 500);
    }
  }

  protected async findById(
    id: string,
    projection?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<T | null> {
    try {
      return await this.model.findById(id, projection, options);
    } catch (error) {
      logger.error('Error in findById:', { error, id });
      throw new AppError('Error finding document by ID', 500);
    }
  }

  protected async updateById(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, update, options);
    } catch (error: unknown) {
      logger.error('Error in updateById:', { error, id, update });
      if (this.isMongoError(error) && error.code === 11000) {
        throw new AppError('Duplicate entry', 400);
      }
      throw new AppError('Error updating document by ID', 500);
    }
  }

  protected async deleteById(id: string): Promise<T | null> {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      logger.error('Error in deleteById:', { error, id });
      throw new AppError('Error deleting document by ID', 500);
    }
  }

  private isMongoError(error: unknown): error is MongoError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }
}
