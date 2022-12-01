import express from 'express';
import 'dotenv/config';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongodb from 'mongodb';

import DB from './models/db.js';
import apiRouter from './routes/apiRoutes.js';

const app = express();

DB.connect(async (client) => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
    client.close();

}).catch(e => {
    console.log(e.message);
});

app.use(express.json());

app.use(rateLimit({
    windowMs: 1000 * 60 * 2,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
}));

app.use(helmet());

app.use("/api", apiRouter);