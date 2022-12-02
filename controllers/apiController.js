import JWT from "jsonwebtoken";
import fs from 'fs';
import path from 'path';

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
                    client.close();
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

    }
}