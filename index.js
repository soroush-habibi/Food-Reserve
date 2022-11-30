import express from 'express';
import 'dotenv/config';

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
    const result = await DB.createFood("soroush", "SShh1382@$", "beaf", 1, 6000, ["pardis1", "pardis2"], new Date(2022, 12, 1)).catch(e => console.log(e));
    console.log(result);

}).catch(e => {
    console.log(e.message);
});