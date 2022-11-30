import mongodb from 'mongodb';
import bcrypt from 'bcrypt';

export default class DB {
    static async connect(func) {
        this.client = await mongodb.MongoClient.connect(process.env.MONGODB_URL);
        func(this.client);
    }

    static async existsUsername(username) {
        const result = await this.client.db("Food").collection("users").countDocuments({ username: username });
        return result ? true : false;
    }

    static async existsEmail(email) {
        const result = await this.client.db("Food").collection("users").countDocuments({ email: email });
        return result ? true : false;
    }

    static async createUser(fullname, password) {
        let studentId, foodCode;
        if (fullname.length < 7) {
            throw "fullname should be greater than 6 characters";
        } if (password.length < 8) {
            throw "password should be at least 7 characters";
        }
        if (await this.client.db("Food").collection("users").countDocuments({}) === 0) {
            studentId = 40013131000;
            foodCode = 122000;
        } else {
            await this.client.db("Food").collection("users").aggregate([
                {
                    $sort: {
                        student_id: -1
                    }
                }, {
                    $limit: 1
                }
            ]).forEach(value => studentId = value.student_id + 1);

            await this.client.db("Food").collection("users").aggregate([
                {
                    $sort: {
                        food_code: -1
                    }
                }, {
                    $limit: 1
                }
            ]).forEach(value => foodCode = value.food_code + 1);
        }

        const result = await this.client.db("Food").collection("users").insertOne({
            student_id: studentId,
            food_code: foodCode,
            food_code_password: 1,
            fullname: fullname,
            username: String(studentId),
            password: bcrypt.hashSync(password, 10),
            email: "",
            admin: false,
            currency: 0,
            currency_transactions: [],
            food_reserves: []
        });

        return result;
    }

    static async updateFoodCodePassword(username, password, newCode) {
        if (password == null || newCode == null || typeof newCode !== "number" || typeof username !== "string") {
            throw "invalid input";
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username }, { _id: 0, password: 1 });

        if (!hashedPassword) {
            throw "can not find user";
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: username }, { $set: { food_code_password: newCode } });
            return result;
        } else {
            throw "Password is wrong";
        }
    }

    static async updateUsername(oldUsername, password, newUsername) {
        if (typeof oldUsername !== "string" || oldUsername == null || typeof password !== "string" || password == null
            || typeof newUsername !== "string" || newUsername == null || newUsername.length < 5) {
            throw "invalid input";
        }

        if (/^\d+$/.test(newUsername)) {
            throw "username should contain at least 1 character";
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: oldUsername });

        if (!hashedPassword) {
            throw "can not find user";
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: oldUsername }, { $set: { username: newUsername } });
            return result;
        } else {
            throw "Password is wrong";
        }
    }

    static async updatePassword(username, oldPassword, newPassword) {
        if (username == null || typeof username !== "string" || oldPassword == null || typeof oldPassword !== "string"
            || newPassword == null || typeof newPassword !== "string" || newPassword.length < 8) {
            throw "invalid input";
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw "can not find user";
        } else if (await bcrypt.compare(oldPassword, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: username }, { $set: { password: bcrypt.hashSync(newPassword, 10) } });
            return result;
        } else {
            throw "Password is wrong";
        }
    }

    static async updateEmail(username, password, newEmail) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" ||
            newEmail == null || !(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(newEmail))) {
            throw "invalid input";
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw "can not find user"
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = this.client.db("Food").collection("users").updateOne({ username: username }, { $set: { email: newEmail } });
            return result;
        } else {
            throw "Password is wrong";
        }
    }

    static async increaseCurrency(username, password, amount) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || typeof amount !== "number" || amount <= 0) {
            throw "invalid input";
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw "can not find user";
        } else if (!(await bcrypt.compare(password, hashedPassword.password))) {
            throw "Password is wrong";
        }

        let transaction = {
            amount: amount,
            time: new Date()
        }

        const result = await this.client.db("Food").collection("users").updateOne({ username: username }, { $push: { currency_transactions: transaction } });
        const result2 = await this.client.db("Food").collection("users").updateOne({ username: username }, { $inc: { currency: transaction.amount } });

        return { result, result2 };
    }

    static async createFood(username, password, name, meal, price, locations, time) {
        console.log(username, password, name, meal, price, locations, time);
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || typeof name !== "string"
            || name.length <= 3 || typeof meal !== "number" || meal < 1 || meal > 5 || typeof price !== "number" || price <= 0
            || !(locations instanceof Array) || !(time instanceof Date)) {
            throw "invalid input";
        }

        const data = await this.client.db("Food").collection("foods").countDocuments({ name: name, meal: meal, time: time });

        if (data > 0) {
            throw "you register this food before"
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw "can not find user";
        } else if (!hashedPassword.admin) {
            throw "you dont have permission to add food";
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("foods").insertOne({ name: name, meal: meal, price: price, locations: locations, time: time });
            return result;
        } else {
            throw "Password is wrong";
        }
    }
}