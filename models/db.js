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
            username: studentId,
            password: bcrypt.hashSync(password, 10),
            email: null,
            currency: 0,
            currency_transactions: [],
            food_reserves: []
        });

        return result;
    }

    static async changeFoodCodePassword(studentId, password, newCode) {
        if (password == null || newCode == null || typeof newCode !== "number") {
            throw "new code or password is invalid";
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ student_id: studentId }, { _id: 0, password: 1 });

        if (!hashedPassword) {
            throw "can not find user";
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ student_id: studentId }, { $set: { food_code_password: newCode } });
            return result;
        } else {
            throw "Password is wrong";
        }
    }
}