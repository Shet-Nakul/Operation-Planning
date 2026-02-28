import { Request, Response, NextFunction } from 'express';
import { InfectionTypesService } from '../services/infectionTypesService';

export class InfectionTypesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InfectionTypesService.list();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await InfectionTypesService.getById(id);
      if (!result) return res.status(404).json({ error: 'Not found' });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InfectionTypesService.create(req.body, req, res);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await InfectionTypesService.update(id, req.body, req, res);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await InfectionTypesService.delete(id, req, res);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}