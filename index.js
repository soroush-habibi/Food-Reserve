import express from 'express';
import 'dotenv/config';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongodb from 'mongodb';

import DB from './models/db.js';

const app = express();

DB.connect(async (client) => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
    // await DB.createUser("Soroush Habibi", "SShh1382@$").catch((e) => {
    //     console.log(e);
    // });
    // const result = await DB.updateFoodCodePassword("40013131000", "sshh1382", 12).catch(e => {
    //     console.log(e);
    // });
    // const result = await DB.updateUsername("40013131001", "sshh1382", "soroush").catch(e => console.log(e));
    // const result = await DB.updatePassword("soroush", "sshh1382", "SShh1382@$").catch(e => console.log(e));
    // const result = await DB.updateEmail("soroush", "SShh1382@$", "soroush@outlook.com").catch(e => console.log(e));
    // const result = await DB.increaseCurrency("soroush", "SShh1382@$", 100).catch(e => console.log(e));
    // const result = await DB.createFood("soroush", "SShh1382@$", "chicken", 2, 4000, ["pardis1", "pardis2"], new Date(2022, 12, 4)).catch(e => console.log(e));
    // const result = await DB.reserveFood("40013131000", "sshh1382", mongodb.ObjectId("6388ac37970f14fd91949ec1"), 6, "pardis1").catch(e => console.log(e));
    // DB.login("soroush", "SShh1382@$").then(res => console.log(res)).catch(e => console.log(e));
    // console.log(result);

}).catch(e => {
    console.log(e.message);
});

app.use(rateLimit({
    windowMs: 1000 * 60 * 2,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
}));

app.use(helmet());