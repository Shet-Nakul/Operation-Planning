import { Router } from 'express';
import * as nonRenewableResourcesController from '../controllers/nonRenewableResourcesController';

const router = Router();

// Non-renewable Resources
router.post('/', nonRenewableResourcesController.createNonRenewableResource);
router.get('/', nonRenewableResourcesController.getNonRenewableResources);
router.get('/:resource_id', nonRenewableResourcesController.getNonRenewableResourceById);
router.patch('/:resource_id', nonRenewableResourcesController.updateNonRenewableResource);
router.delete('/:resource_id', nonRenewableResourcesController.deleteNonRenewableResource);

export default router;
