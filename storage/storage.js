import FileQueue from "./writer.js";
import Users from "./users.js";
import Cache from "./cache.js";
import crypto from "crypto"

import { pipeline } from "stream/promises";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises"

class Storage {
    constructor() {
        this.cache = new Cache();
        this.actionLog = new FileQueue("storage/action_log.csv");
        this.users = new Users("storage/users.txt")
        this.imageDir = "./storage/images";
        this.maxShiftTiming = 8 * 60 * 60 * 1000;
    }

    createShift(id, transport) {
        const date = new Date();
        const hash = crypto.createHash('sha256')
        .update(id.toString()).update(date.toString()).digest('hex');
        this.cache.addShiftWhole(id, hash, date, transport);

        const number = this.cache.getNumber(id);
        const shiftType = this.cache.getShiftType(id);
        this.actionLog.write(`${id};${number};create;${date.toISOString()};${hash};${shiftType};${transport}`);
    }

    closeShift(id) {
        const date = new Date();
        const shift_id = this.cache.getShiftID(id);
        this.cache.deleteShift(id);

        const number = this.cache.getNumber(id);
        this.actionLog.write(`${id};${number};close;${date.toISOString()};${shift_id};;`);
    }

    checkShiftTiming(id) {
        const now = new Date();
        const shiftDate = this.cache.getShiftDate(id);

        const diff = now - shiftDate;
        if (diff > this.maxShiftTiming) {
            const shiftMaxDate = new Date(shiftDate.getTime() + this.maxShiftTiming);
            const shift_id = this.cache.getShiftID(id);
            this.cache.deleteShift(id);

            const number = this.cache.getNumber(id);
            this.actionLog.write(`${id};${number};close;${shiftMaxDate.toISOString()};${shift_id};;`);
            return false;
        }
        return true;
    }

    async createReport(id, uniqueID, link) {
        const reportDate = new Date();
        const shift_id = this.cache.getShiftID(id);
        const number = this.cache.getNumber(id);
        const shiftType = this.cache.getShiftType(id).replaceAll(" ", "");
        const shiftTransport = this.cache.getShiftTransport(id).replaceAll(" ", "");
        const shiftBeginDate = this.cache.getShiftDate(id).toLocaleString('ru-RU', {
            timeZone: 'Europe/Moscow'
        }).replace(/[,.]/g, ":").replace(/[ ]/, "");


        const folderName = `${number}_${shiftType}_${shiftTransport}_${shiftBeginDate}_${shift_id}`;
        const folderPath = `${this.imageDir}/${folderName}`;
        try {
            await fs.mkdir(folderPath, {recursive: true});
        } catch (err) {
            console.error(err);
        }

        const filePath = `${folderPath}/${uniqueID}.jpg`;
        const response = await fetch(link.href);
        await pipeline(response.body, createWriteStream(filePath));

        this.actionLog.write(`${id};${number};report;${reportDate.toISOString()};${shift_id};/${folderName}/${uniqueID}.jpg;`);
    }
}

export default Storage;