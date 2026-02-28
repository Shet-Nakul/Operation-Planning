import { Request, Response, NextFunction } from 'express';
import { SurgeryPhaseRequirementsService } from '../services/surgeryPhaseRequirementsService';

export class SurgeryPhaseRequirementsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SurgeryPhaseRequirementsService.list();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await SurgeryPhaseRequirementsService.getById(id);
      if (!result) return res.status(404).json({ error: 'Not found' });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const result = await SurgeryPhaseRequirementsService.create(req.body, userId);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.user.id;
      const result = await SurgeryPhaseRequirementsService.update(id, req.body, userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = req.user.id;
      const result = await SurgeryPhaseRequirementsService.delete(id, userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
