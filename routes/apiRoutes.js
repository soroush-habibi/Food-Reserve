import express from 'express';

import apiController from '../controllers/apiController.js';

const router = express.Router();

router.get("/login", apiController.login);

export default router;