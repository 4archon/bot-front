import fs from "node:fs/promises";

async function readTokenFile(path) {
    try {
        const data = await fs.readFile(path, {encoding : "utf8"});
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function getConfig() {
    return {
        tg_token: await readTokenFile("config/tg.token")
    }
}

export default getConfig;