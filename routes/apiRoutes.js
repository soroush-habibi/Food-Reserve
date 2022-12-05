import express from 'express';

import apiController from '../controllers/apiController.js';

const router = express.Router();

router.get("/user", apiController.login);

router.post("/user", apiController.register);

router.put("/user", apiController.authorization, apiController.editUser);

router.post("/user/increase-currency", apiController.authorization, apiController.increaseCurrency);

router.post("/food", apiController.authorization, apiController.createFood);

router.post("/food/reserve", apiController.authorization, apiController.reserveFood);

export default router;