import fs from "node:fs/promises";

class FileQueue {
    constructor(path) {
        this.path = path;
        this.queue = Promise.resolve();
    }

    write(str) {
        this.queue = this.queue.then(async () => {
            try {
                await fs.appendFile(this.path, str + "\n");
            } catch (err) {
                console.error(`Ошибка записи: ${err}`);
            }
        });
    }
}

export default FileQueue;