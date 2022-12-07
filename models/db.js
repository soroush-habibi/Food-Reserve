import mongodb from 'mongodb';
import bcrypt, { hash } from 'bcrypt';

export default class DB {
    static async connect(func) {
        this.client = await mongodb.MongoClient.connect(process.env.MONGODB_URL);
        func(this.client);
    }

    static async existsUsername(username) {
        const result = await this.client.db("Food").collection("users").countDocuments({ username: username });
        return result ? true : false;
    }

    static async login(username, password) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string") {
            throw new Error("invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            return true;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async createUser(fullname, password) {
        if (fullname == null || typeof fullname !== "string" || password == null || typeof password !== "string") {
            throw new Error("invalid input");
        }

        let studentId, foodCode;
        if (fullname.length < 7) {
            throw new Error("fullname should be greater than 6 characters");
        } if (password.length < 8) {
            throw new Error("password should be at least 7 characters");
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
        if (username == null || password == null || newCode == null || typeof username !== "string" || typeof password !== "string" || typeof newCode !== "number") {
            throw new Error("invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username }, { _id: 0, password: 1 });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: username }, { $set: { food_code_password: newCode } });
            return result;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async updateUsername(oldUsername, password, newUsername) {
        if (typeof oldUsername !== "string" || oldUsername == null || typeof password !== "string" || password == null
            || typeof newUsername !== "string" || newUsername == null || newUsername.length < 5) {
            throw new Error("invalid input");
        }

        if (/^\d+$/.test(newUsername)) {
            throw new Error("username should contain at least 1 character");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: oldUsername });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: oldUsername }, { $set: { username: newUsername } });
            return result;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async updatePassword(username, oldPassword, newPassword) {
        if (username == null || typeof username !== "string" || oldPassword == null || typeof oldPassword !== "string"
            || newPassword == null || typeof newPassword !== "string" || newPassword.length < 8) {
            throw new Error("invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (await bcrypt.compare(oldPassword, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: username }, { $set: { password: bcrypt.hashSync(newPassword, 10) } });
            return result;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async updateEmail(username, password, newEmail) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" ||
            newEmail == null || !(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(newEmail))) {
            throw new Error("invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const data = await this.client.db("Food").collection("users").findOne({ email: newEmail });
            if (data) {
                throw new Error("email registered before");
            }
            const result = this.client.db("Food").collection("users").updateOne({ username: username }, { $set: { email: newEmail } });
            return result;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async increaseCurrency(username, password, amount) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || typeof amount !== "number" || amount <= 0) {
            throw new Error("invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (!(await bcrypt.compare(password, hashedPassword.password))) {
            throw new Error("Password is wrong");
        }

        let transaction = {
            amount: amount,
            time: new Date()
        }

        const result = await this.client.db("Food").collection("users").updateOne({ username: username }, { $push: { currency_transactions: transaction } });
        const result2 = await this.client.db("Food").collection("users").updateOne({ username: username }, { $inc: { currency: transaction.amount } });

        return { result, result2 };
    }

    static async reserveFood(username, password, id, amount, location) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || id == null || !(id instanceof mongodb.ObjectId)
            || amount == null || amount <= 0 || location == null || typeof location !== "string") {
            throw new Error("invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("cant not find user");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const food = await this.client.db("Food").collection("foods").findOne({ _id: id });

            for (let i of food.users) {
                if (i.username === username) {
                    throw new Error("you reserved this food");
                }
            }

            for (let i of hashedPassword.food_reserves) {
                if (food.meal === i.meal && food.time.getTime() === i.time.getTime()) {
                    throw new Error("you can not reserve another food in this time");
                }
            }

            if (!food) {
                throw new Error("can not find food");
            } else if ((food.time.getTime() - (1000 * 60 * 60 * 24)) < Date.now()) {
                throw new Error("food is expired");
            } else if (!food.locations.includes(location)) {
                throw new Error("you can not reserve food on this location");
            } else if (hashedPassword.currency < (food.price * amount)) {
                throw new Error("you dont have enough money")
            } else {
                const result = await this.client.db("Food").collection("foods").updateOne({ _id: id }, {
                    $inc: { reserves_count: amount },
                    $push: {
                        users: {
                            username: username,
                            money: amount * food.price,
                            location: location
                        }
                    }
                });
                const result2 = await this.client.db("Food").collection("users").updateOne({ username: username }, {
                    $push: {
                        food_reserves: {
                            name: food.name,
                            meal: food.meal,
                            price: food.price * amount,
                            reserve_time: new Date(),
                            time: food.time,
                            amount: amount,
                            used: false,
                            location: location
                        }
                    }, $inc: {
                        currency: -(food.price * amount)
                    }
                });
                return { result, result2 };
            }
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async cancelReserve(username, password, id) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || id == null || !(id instanceof mongodb.ObjectId)) {
            throw new Error("Invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const food = await this.client.db("Food").collection("foods").findOne({ _id: id });

            if (!food) {
                throw new Error("can not find food");
            }

            let money = 0;

            for (let i of food.users) {
                if (username === i.username) {
                    money = i.money;
                }
            }

            if (money === 0) {
                throw new Error("user does not reserve this food");
            } else {
                console.log(money);
                const result = await this.client.db("Food").collection("foods").updateOne({ _id: id }, {
                    $pull: { users: { username: username } },
                    $inc: {
                        reserves_count: -parseInt(money / food.price)
                    }

                });
                const result2 = await this.client.db("Food").collection("users").updateOne({ username: username }, {
                    $pull: {
                        food_reserves: {
                            name: food.name,
                            meal: food.meal,
                            time: food.time
                        }
                    },
                    $inc: { currency: money }

                });

                return { result, result2 };
            }
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async createFood(username, password, name, meal, price, locations, time) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || typeof name !== "string"
            || name.length <= 3 || typeof meal !== "number" || meal < 1 || meal > 5 || typeof price !== "number" || price <= 0
            || !(locations instanceof Array) || !(time instanceof Date)) {
            throw new Error("invalid input");
        }

        const data = await this.client.db("Food").collection("foods").countDocuments({ name: name, meal: meal, time: time });

        if (data > 0) {
            throw new Error("you register this food before");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (!hashedPassword.admin) {
            throw new Error("you dont have permission to add food");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("foods").insertOne({
                name: name,
                meal: meal,
                price: price,
                locations: locations,
                time: time,
                reserves_count: 0,
                users: []
            });
            return result;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async deleteFood(username, password, id) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || id == null || !(id instanceof mongodb.ObjectId)) {
            throw new Error("invalid input");
        }

        const food = await this.client.db("Food").collection("foods").findOne({ _id: id });

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!food) {
            throw new Error("can not find food");
        } else if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (!hashedPassword.admin) {
            throw new Error("you dont have permission to delete food");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const users = await this.client.db("Food").collection("foods").findOne({ _id: id });

            for (let i of users.users) {
                await this.client.db("Food").collection("users").updateOne({ username: i.username }, { $inc: { currency: i.money } });
            }

            const result = await this.client.db("Food").collection("foods").deleteOne({ _id: id });
            const result2 = await this.client.db("Food").collection("users").updateMany(
                {
                    food_reserves: {
                        $elemMatch: {
                            name: food.name, meal: food.meal, time: food.time
                        }
                    }
                }, {
                $pull: {
                    food_reserves: {
                        name: food.name,
                        meal: food.meal,
                        time: food.time
                    }
                }
            }
            );
            return { result, result2 };
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async promote(username, password, targetUser) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || targetUser == null || typeof targetUser !== "string") {
            throw new Error("invalid input");
        }

        const t = await this.client.db("Food").collection("users").findOne({ username: targetUser });

        if (!t) {
            throw new Error("can not find target user");
        } else if (t.admin) {
            throw new Error("target user is admin already");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find admin username");
        } else if (!hashedPassword.admin) {
            throw new Error("you dont have permission to promote anyone");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: targetUser }, { $set: { admin: true } });
            return result;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async demote(username, password, targetUser) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || targetUser == null || typeof targetUser !== "string") {
            throw new Error("invalid input");
        }

        const t = await this.client.db("Food").collection("users").findOne({ username: targetUser });

        if (!t) {
            throw new Error("can not find target user");
        } else if (!t.admin) {
            throw new Error("target user is not admin already");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find admin username");
        } else if (!hashedPassword.admin) {
            throw new Error("you dont have permission to promote anyone");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            const result = await this.client.db("Food").collection("users").updateOne({ username: targetUser }, { $set: { admin: false } });
            return result;
        } else {
            throw new Error("Password is wrong");
        }
    }

    static async getFoods(username, password, year, month, day) {
        if (username == null || typeof username !== "string" || password == null || typeof password !== "string" || year == null || typeof year !== "number"
            || month == null || typeof month !== "number" || day == null || typeof day !== "number") {
            throw new Error("Invalid input");
        }

        const hashedPassword = await this.client.db("Food").collection("users").findOne({ username: username });

        if (!hashedPassword) {
            throw new Error("can not find user");
        } else if (await bcrypt.compare(password, hashedPassword.password)) {
            let meal1 = [];
            let meal2 = [];
            let meal3 = [];
            let meal4 = [];
            let meal5 = [];

            const time1 = new Date(year, month - 1, day, 0, 0, 0);
            const time2 = new Date(year, month - 1, day, 23, 59, 59, 999);

            let foods = [];

            await this.client.db("Food").collection("foods").find({ time: { $gte: time1, $lte: time2 } }).forEach(value => {
                foods.push(value);
            });

            for (let i of foods) {
                switch (i.meal) {
                    case 1:
                        meal1.push(i);
                        break;
                    case 2:
                        meal2.push(i);
                        break;
                    case 3:
                        meal3.push(i);
                        break;
                    case 4:
                        meal4.push(i);
                        break;
                    case 5:
                        meal5.push(i);
                        break;
                }
            }

            return [meal1, meal2, meal3, meal4, meal5];
        } else {
            throw new Error("Password is wrong");
        }
    }
}