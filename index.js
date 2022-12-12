import express from 'express';
import 'dotenv/config';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cluster from 'cluster';
import os from 'os';

import DB from './models/db.js';
import apiRouter from './routes/apiRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.ROOT = __dirname;

if (cluster.isPrimary) {
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }
    cluster.on("exit", (worker, code, signal) => {
        console.log(`worker with ${worker.process.pid} end with code ${code} and signal ${signal}`);
        cluster.fork();
    });
} else {
    const app = express();

    DB.connect(async (client) => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT} in worker ${cluster.worker.process.pid}`);
        });
        client.close();

    }).catch(e => {
        console.log(e.message);
    });

    app.use(express.json());
    app.use(cookieParser());

    app.use(rateLimit({
        windowMs: 1000 * 60 * 2,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false
    }));

    app.use(helmet());

    app.use("/api", apiRouter);
}