import { Markup, Telegraf } from "telegraf";
import { message } from "telegraf/filters";

import Storage from "../storage/storage.js"
import Auth from "../authentication/authentication.js";


async function start(ctx) {
    const check = this.auth.checkUser(ctx);
	if (!check) return;
    this.recovery(ctx);
}

async function contact(ctx) {
    const check = this.auth.checkUserCache(ctx);
    if (check) return;

    const contact = ctx.message.contact;
	const number = contact.phone_number;
	const userID = contact.user_id;
	if (await (this.storage.users.checkUser(number))) {
		this.storage.cache.addUser(userID, number);
		await ctx.reply("Ваш номер телефона зарегестрирован", Markup.removeKeyboard());
        this.recovery(ctx);
	} else {
		ctx.reply("Ваш номер телефона не зарегистрирован", Markup.removeKeyboard());
	}
}

async function recovery(ctx) {
    const step = this.storage.cache.step(ctx.from.id);
    switch (step) {
        case "shift1":
            this.chooseShiftStep1(ctx);
            break;
        case "shift2":
            this.chooseShiftStep2(ctx);
            break;
        case "close":
            this.closeShift(ctx);
            break;
    }
}

async function chooseShiftStep1(ctx) {
    const check = this.auth.checkUser(ctx);
	if (!check) return;
    ctx.reply("Выберите роль для смены:", Markup.inlineKeyboard([
        [Markup.button.callback("Энерджайзер", "shift_role_enrj")],
        [Markup.button.callback("Водитель перезарядка", "shift_role_drv_recharge")],
        [Markup.button.callback("Водитель релокация", "shift_role_drv_relocation")],
        [Markup.button.callback("Водитель вывоз", "shift_role_drv_removal")],
        [Markup.button.callback("Водитель сбор", "shift_role_drv_collection")],
    ]));
}

async function actionChooseShiftStep1(ctx) {
    ctx.answerCbQuery();
    ctx.deleteMessage();

    const check = this.auth.checkUser(ctx);
    if (!check) return;

    const step = this.storage.cache.step(ctx.from.id);
    if (step != "shift1") {
        this.recovery(ctx);
        return;
    }

    const chosen = ctx.callbackQuery.data;
    switch (chosen) {
        case 'shift_role_enrj':
            this.storage.cache.addShiftType(check.id, "Энерджайзер")
            break;
        case 'shift_role_drv_recharge':
            this.storage.cache.addShiftType(check.id, "Водитель перезарядка")
            break;
        case 'shift_role_drv_relocation':
            this.storage.cache.addShiftType(check.id, "Водитель релокация")
            break;
        case 'shift_role_drv_removal':
            this.storage.cache.addShiftType(check.id, "Водитель вывоз")
            break;
        case 'shift_role_drv_collection':
            this.storage.cache.addShiftType(check.id, "Водитель сбор")
            break;
    }
    this.recovery(ctx);
}

async function chooseShiftStep2(ctx) {
    const check = this.auth.checkUser(ctx);
	if (!check) return;

    const type = this.storage.cache.getShiftType(check.id);
    if (type == "Энерджайзер") {
        ctx.reply("Выберите транспорт для смены:", Markup.inlineKeyboard([
            [Markup.button.callback("Самокат", "shift_transport_scooter")]
        ]));
    } else {
        ctx.reply("Выберите транспорт для смены:", Markup.inlineKeyboard([
            [Markup.button.callback("Личное авто", "shift_transport_self")],
            [Markup.button.callback("Яндекс Драйв", "shift_transport_yadrive")]
        ]));
    }
}

async function actionChooseShiftStep2(ctx) {
    ctx.answerCbQuery();
    ctx.deleteMessage();

    const check = this.auth.checkUser(ctx);
    if (!check) return;

    const step = this.storage.cache.step(ctx.from.id);
    if (step != "shift2") {
        this.recovery(ctx);
        return;
    }

    const type = this.storage.cache.getShiftType(check.id);
    const chosen = ctx.callbackQuery.data;
    switch (chosen) {
        case 'shift_transport_scooter':
            if (type == "Энерджайзер") {
                this.storage.createShift(check.id, "Самокат");
            }
            break;
        case 'shift_transport_self':
            if (type != "Энерджайзер") {
                this.storage.createShift(check.id, "Личное авто");
            }
            break;
        case 'shift_transport_yadrive':
            if (type != "Энерджайзер") {
                this.storage.createShift(check.id, "Яндекс Драйв");
            }
            break;
    }
    this.recovery(ctx);
}

async function closeShift(ctx) {
    const check = this.auth.checkUser(ctx);
	if (!check) return;

    const checkTiming = this.storage.checkShiftTiming(check.id);
    if (!checkTiming) {
        this.recovery(ctx);
        return;
    }

    ctx.reply("Теперь вы можете отправлять фотографии.\
        Закройте смену по кнопке ниже в конце смены:",
        Markup.inlineKeyboard([
        [Markup.button.callback("Закрыть смену", "shift_close")],
    ]));
}

async function actionCloseShift(ctx) {
    ctx.answerCbQuery();
    ctx.deleteMessage();

    const check = this.auth.checkUser(ctx);
    if (!check) return;

    const step = this.storage.cache.step(ctx.from.id);
    if (step != "close") {
        this.recovery(ctx);
        return;
    }

    const checkTiming = this.storage.checkShiftTiming(check.id);
    if (!checkTiming) {
        this.recovery(ctx);
        return;
    }

    const chosen = ctx.callbackQuery.data;
    switch (chosen) {
        case 'shift_close':
            this.storage.closeShift(check.id);
            break;
    }
    this.recovery(ctx);
}

async function shiftPhoto(ctx) {
    const check = this.auth.checkUser(ctx);
    if (!check) return;

    const step = this.storage.cache.step(ctx.from.id);
    if (step != "close") {
        ctx.reply("Фото не принимаются вне смены");
        return;
    }

    const checkTiming = this.storage.checkShiftTiming(check.id);
    if (!checkTiming) {
        this.recovery(ctx);
        return;
    }

    const photo = ctx.message.photo[ctx.message.photo.length - 1];
	const id = photo.file_id;
	const uniqueID = photo.file_unique_id;

    const link = await ctx.telegram.getFileLink(id);
    await this.storage.createReport(check.id, uniqueID, link);
    ctx.reply(`Фото ${uniqueID} принято`);
}


class Bot {
    constructor(token) {
        this.storage = new Storage();
	    this.auth = new Auth(this.storage);

        this.bot = new Telegraf(token);
        this.setHandlers();
        this.setDescription();
    }

    setHandlers() {
        this.bot.start(this.start.bind(this));
        this.bot.on(message('contact'), this.contact.bind(this));

        this.bot.action(['shift_role_enrj', 'shift_role_drv_recharge',
            'shift_role_drv_relocation', 'shift_role_drv_removal',
            'shift_role_drv_collection'], this.actionChooseShiftStep1.bind(this));
        
        this.bot.action(['shift_transport_scooter', 'shift_transport_self',
            'shift_transport_yadrive'], this.actionChooseShiftStep2.bind(this));
        
        this.bot.action(['shift_close'], this.actionCloseShift.bind(this));
        this.bot.on(message('photo'), this.shiftPhoto.bind(this));
    }

    setDescription() {
        this.bot.telegram.setMyCommands([
            {command: "start", description: "Используйте для начала работы или восстановления текущего шага"}
        ]);
    }

    run() {
        this.bot.launch();

	    process.once('SIGINT', () => this.bot.stop('SIGINT'));
	    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    start = start;
    contact = contact;
    recovery = recovery;
    chooseShiftStep1 = chooseShiftStep1;
    actionChooseShiftStep1 = actionChooseShiftStep1;
    chooseShiftStep2 = chooseShiftStep2;
    actionChooseShiftStep2 = actionChooseShiftStep2;
    closeShift = closeShift;
    actionCloseShift = actionCloseShift;
    shiftPhoto = shiftPhoto;

}

export default Bot;