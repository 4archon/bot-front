import fs from "node:fs/promises";

class Users {
    constructor(path) {
        this.path = path;
    }

    async checkUser(userNumber) {
        const file = await fs.open(this.path);
        for await (const line of file.readLines()) {
            if (userNumber === line) {
                file.close();
                return true;
            }
        }
        file.close();
        return false;
    }
}

export default Users;