import express from 'express';

import apiController from '../controllers/apiController.js';

const router = express.Router();

router.get("/user", apiController.login);

router.post("/user", apiController.register);

export default router;