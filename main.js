import getConfig from "./config/config.js";
import Bot from "./bot/bot.js";


async function main() {
	const config = await getConfig();
	const bot = new Bot(config.tg_token);
	bot.run();
}

main();