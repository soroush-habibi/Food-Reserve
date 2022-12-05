import JWT from "jsonwebtoken";
import fs from 'fs';
import path from 'path';
import mongodb from 'mongodb';

import DB from "../models/db.js";

export default class apiController {
    static async login(req, res) {
        if (!req.query.username || !req.query.password) {
            res.status(400).json({
                success: false,
                body: false,
                message: "Invalid input"
            });
            return;
        }
        try {
            DB.connect((client) => {
                DB.login(decodeURIComponent(req.query.username), String(decodeURIComponent(req.query.password))).then(response => {
                    if (response == true) {
                        const token = JWT.sign({
                            username: req.query.username,
                            password: req.query.password
                        }, fs.readFileSync(path.join(process.env.ROOT, "private.key")), { algorithm: "RS256", expiresIn: "7d" });
                        res.cookie("JWT", token, { httpOnly: true, expires: new Date(Date.now() + 604800000) });
                        res.status(200).json({
                            success: true,
                            body: decodeURIComponent(req.query.username),
                            message: "OK"
                        });
                    } else {
                        res.status(400).json({
                            success: false,
                            body: false,
                            message: "failed"
                        });
                    }
                    client.close();
                }).catch(e => {
                    res.status(403).json({
                        success: false,
                        body: false,
                        message: e.message
                    });
                });
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: false,
                message: "Internal Error"
            });
        }
    }

    static async authorization(req, res, next) {
        if (!req.cookies.JWT) {
            res.status(403).json({
                success: false,
                body: null,
                message: "Forbidden"
            });
            return;
        }

        try {
            JWT.verify(req.cookies.JWT, fs.readFileSync(path.join(process.env.ROOT, "public.key")), (err, payload) => {
                if (err) {
                    res.status(403).json({
                        success: false,
                        body: null,
                        message: "Forbidden"
                    });
                } else {
                    req.username = payload.username;
                    req.password = payload.password;
                    next();
                }
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        }
    }

    static async register(req, res) {
        if (!req.body.fullname || !req.body.password) {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        try {
            DB.connect(async (client) => {
                const result = await DB.createUser(req.body.fullname, req.body.password).catch(e => {
                    if (e.message.includes("duplicate")) {
                        res.status(400).json({
                            success: false,
                            body: null,
                            message: "fullname exists"
                        });
                    } else {
                        res.status(400).json({
                            success: false,
                            body: null,
                            message: e.message
                        });
                    }
                });

                client.close();

                if (!result) {
                    return
                }
                if (result.acknowledged) {
                    res.status(201).json({
                        success: true,
                        body: result.insertedId,
                        message: "OK"
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        body: result,
                        message: "Internal error"
                    });
                }
            }).catch(e => {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        }
    }

    static async editUser(req, res) {
        if (typeof req.body.type !== "number" || req.body.type < 0 || req.body.type > 5) {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        try {
            DB.connect(async (client) => {
                switch (req.body.type) {
                    case 0:                         //!Update food code password
                        if (typeof req.body.newCode !== "number" || String(req.body.newCode).length !== 6) {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: "Invalid input"
                            });
                            return;
                        }

                        const result = await DB.updateFoodCodePassword(req.username, req.password, req.body.newCode).catch(e => {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: e.message
                            });
                        });

                        if (!result) {
                            return
                        }
                        if (result.acknowledged) {
                            res.status(200).json({
                                success: true,
                                body: result.modifiedCount,
                                message: "OK"
                            });
                        } else {
                            res.status(500).json({
                                success: false,
                                body: result,
                                message: "Internal error"
                            });
                        }
                        break;
                    case 1:                         //!Update username
                        if (req.body.newUsername == null || typeof req.body.newUsername !== "string") {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: "Invalid input"
                            });
                            return;
                        }

                        const result2 = await DB.updateUsername(req.username, req.password, req.body.newUsername).catch(e => {
                            if (e.message.includes("duplicate")) {
                                res.status(400).json({
                                    success: false,
                                    body: null,
                                    message: "username exists"
                                });
                            } else {
                                res.status(400).json({
                                    success: false,
                                    body: null,
                                    message: e.message
                                });
                            }
                        });

                        if (!result2) {
                            return
                        }
                        if (result2.acknowledged) {
                            const token = JWT.sign({
                                username: req.body.newUsername,
                                password: req.password
                            }, fs.readFileSync(path.join(process.env.ROOT, "private.key")), { algorithm: "RS256", expiresIn: "7d" });
                            res.cookie("JWT", token, { httpOnly: true, expires: new Date(Date.now() + 604800000) });
                            res.status(200).json({
                                success: true,
                                body: result2.modifiedCount,
                                message: "OK"
                            });
                        } else {
                            res.status(500).json({
                                success: false,
                                body: result2,
                                message: "Internal error"
                            });
                        }
                        break;
                    case 2:                         //!Update password
                        if (req.body.newPassword == null || typeof req.body.newPassword !== "string") {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: "Invalid input"
                            });
                            return;
                        }

                        const result3 = await DB.updatePassword(req.username, req.password, req.body.newPassword).catch(e => {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: e.message
                            });
                        });

                        if (!result3) {
                            return
                        }
                        if (result3.acknowledged) {
                            const token = JWT.sign({
                                username: req.username,
                                password: req.body.newPassword
                            }, fs.readFileSync(path.join(process.env.ROOT, "private.key")), { algorithm: "RS256", expiresIn: "7d" });
                            res.cookie("JWT", token, { httpOnly: true, expires: new Date(Date.now() + 604800000) });
                            res.status(200).json({
                                success: true,
                                body: result3.modifiedCount,
                                message: "OK"
                            });
                        } else {
                            res.status(500).json({
                                success: false,
                                body: result3,
                                message: "Internal error"
                            });
                        }
                        break;
                    case 3:                         //!Update email
                        if (req.body.newEmail == null || typeof req.body.newEmail !== "string") {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: "Invalid input"
                            });
                            return;
                        }

                        const result4 = await DB.updateEmail(req.username, req.password, req.body.newEmail).catch(e => {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: e.message
                            });
                        });

                        if (!result4) {
                            return
                        }
                        if (result4.acknowledged) {
                            res.status(200).json({
                                success: true,
                                body: result4.modifiedCount,
                                message: "OK"
                            });
                        } else {
                            res.status(500).json({
                                success: false,
                                body: result4,
                                message: "Internal error"
                            });
                        }
                        break;
                    case 4:                         //!Promote
                        if (req.body.targetUser == null || typeof req.body.targetUser !== "string") {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: "Invalid input"
                            });
                            return;
                        }

                        const result5 = await DB.promote(req.username, req.password, req.body.targetUser).catch(e => {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: e.message
                            });
                        });

                        if (!result5) {
                            return
                        }
                        if (result5.acknowledged) {
                            res.status(200).json({
                                success: true,
                                body: result5.modifiedCount,
                                message: "OK"
                            });
                        } else {
                            res.status(500).json({
                                success: false,
                                body: result5,
                                message: "Internal error"
                            });
                        }
                        break;
                    case 5:                         //!Demote
                        if (req.body.targetUser == null || typeof req.body.targetUser !== "string") {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: "Invalid input"
                            });
                            return;
                        }

                        const result6 = await DB.demote(req.username, req.password, req.body.targetUser).catch(e => {
                            res.status(400).json({
                                success: false,
                                body: null,
                                message: e.message
                            });
                        });

                        if (!result6) {
                            return
                        }
                        if (result6.acknowledged) {
                            res.status(200).json({
                                success: true,
                                body: result6.modifiedCount,
                                message: "OK"
                            });
                        } else {
                            res.status(500).json({
                                success: false,
                                body: result6,
                                message: "Internal error"
                            });
                        }
                        break;
                }
                client.close();
            }).catch(e => {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        }
    }

    static async increaseCurrency(req, res) {
        if (!req.body.amount || typeof req.body.amount !== "number") {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        try {
            DB.connect(async (client) => {
                const result = await DB.increaseCurrency(req.username, req.password, req.body.amount).catch(e => {
                    res.status(400).json({
                        success: false,
                        body: null,
                        message: e.message
                    });
                });

                client.close();

                if (!result) {
                    return;
                }

                if (result.result.acknowledged && result.result2.acknowledged) {
                    res.status(200).json({
                        success: true,
                        body: result.result.modifiedCount + " - " + result.result2.modifiedCount,
                        message: "OK"
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        body: null,
                        message: "Internal error"
                    });
                }
            }).catch(e => {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        }
    }

    static async createFood(req, res) {
        if (req.body.name == null || req.body.meal == null || req.body.price == null || req.body.locations == null || req.body.year == null || req.body.month == null
            || req.body.day == null || req.body.hour == null || req.body.minute == null || typeof req.body.name !== "string" || typeof req.body.meal !== "number"
            || typeof req.body.price !== "number" || !(req.body.locations instanceof Array) || typeof req.body.year !== "number" || typeof req.body.month !== "number"
            || typeof req.body.day !== "number" || typeof req.body.hour !== "number" || typeof req.body.minute !== "number") {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        try {
            const date = new Date(req.body.year, req.body.month - 1, req.body.day, req.body.hour, req.body.minute);
            DB.connect(async (client) => {
                const result = await DB.createFood(req.username, req.password, req.body.name, req.body.meal, req.body.price, req.body.locations, date).catch(e => {
                    res.status(400).json({
                        success: false,
                        body: null,
                        message: e.message
                    });
                });

                client.close();

                if (!result) {
                    return;
                }

                if (result.acknowledged) {
                    res.status(201).json({
                        success: true,
                        body: result.insertedId,
                        message: "OK"
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        body: null,
                        message: "Internal error"
                    });
                }
            }).catch(e => {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        }
    }

    static async deleteFood(req, res) {
        if (req.body.id == null || typeof req.body.id !== "string") {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        let bsonID;

        try {
            bsonID = mongodb.ObjectId(req.body.id);
        } catch (e) {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        try {
            DB.connect(async (client) => {
                const result = await DB.deleteFood(req.username, req.password, bsonID).catch(e => {
                    res.status(400).json({
                        success: false,
                        body: null,
                        message: e.message
                    });
                });

                client.close();

                if (!result) {
                    return;
                }

                if (result.result.acknowledged && result.result2.acknowledged) {
                    res.status(200).json({
                        success: true,
                        body: result.result.deletedCount + " - " + result.result2.modifiedCount,
                        message: "OK"
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        body: null,
                        message: "Internal error"
                    });
                }
            }).catch((e) => {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        }
    }

    static async reserveFood(req, res) {
        if (req.body.id == null || typeof req.body.id !== "string" || req.body.amount == null || typeof req.body.amount !== "number"
            || req.body.location == null || typeof req.body.location !== "string") {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        let bsonID;

        try {
            bsonID = mongodb.ObjectId(req.body.id);
        } catch (e) {
            res.status(400).json({
                success: false,
                body: null,
                message: "Invalid input"
            });
            return;
        }

        try {
            DB.connect(async (client) => {
                const result = await DB.reserveFood(req.username, req.password, bsonID, req.body.amount, req.body.location).catch(e => {
                    res.status(400).json({
                        success: false,
                        body: null,
                        message: e.message
                    });
                });

                if (!result) {
                    return;
                }

                if (result.result.acknowledged && result.result2.acknowledged) {
                    res.status(200).json({
                        success: true,
                        body: result.result.modifiedCount + " - " + result.result2.modifiedCount,
                        message: "OK"
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        body: null,
                        message: "Internal error"
                    });
                }

                client.close();
            }).catch(e => {
                res.status(500).json({
                    success: false,
                    body: null,
                    message: e.message
                });
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                body: null,
                message: e.message
            });
        }
    }
}