import JWT from "jsonwebtoken";

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
                    if (response) {
                        res.status(200).json({
                            success: true,
                            body: decodeURIComponent(req.query.username),
                            message: "OK"
                        });
                    } else {
                        res.status(403).json({
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
}