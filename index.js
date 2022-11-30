import express from 'express';
import 'dotenv/config';

import DB from './models/db.js';

const app = express();

DB.connect(async (client) => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
    // await DB.createUser("Soroush", "sshh1382").catch((e) => {
    //     console.log(e);
    // });
    const result = await DB.changeFoodCodePassword(40013131000, "sshh1382", 1).catch(e => {
        console.log(e);
    })

}).catch(e => {
    console.log(e.message);
});