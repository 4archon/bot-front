

class Cache {
    constructor() {
        this.numbers = new Map();
        this.shifts = new Map();
    }

    getNumber(id) {
        const number = this.numbers.get(id);
        return number;
    }

    addUser(id, number) {
        this.numbers.set(id, number);
    }

    addShiftType(id, type) {
        this.shifts.set(id, {
            shift_id: null,
            date: null,
            type: type,
            transport: null
        });
    }

    addShiftWhole(id, shift_id, date, transport) {
        const shift = this.shifts.get(id);
        shift.shift_id = shift_id;
        shift.date = date;
        shift.transport = transport;
    }

    step(id) {
        const shift = this.shifts.get(id);
        if (shift) {
            if (shift.shift_id) {
                return "close";
            } else {
                return "shift2";
            }
        } else {
            return "shift1";
        }
    }

    getShiftType(id) {
        const shift = this.shifts.get(id);
        return shift.type;
    }

    getShiftID(id) {
        const shift = this.shifts.get(id);
        return shift.shift_id;
    }

    deleteShift(id) {
        this.shifts.delete(id);
    }

    getShiftDate(id) {
        const shift = this.shifts.get(id);
        return shift.date;
    }

    getShiftTransport(id) {
        const shift = this.shifts.get(id);
        return shift.transport;
    }
}

export default Cache;