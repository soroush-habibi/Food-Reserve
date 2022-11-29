import express from 'express';
import 'dotenv/config';

import DB from './models/db.js';

const app = express();

DB.connect((client) => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
    DB.createUser("Soroush", "sshh1382").catch((e) => {
        console.log(e);
    });
}).catch(e => {
    console.log(e.message);
});