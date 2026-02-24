

class Auth {
    constructor(storage) {
        this.storage = storage;
    }

    checkUserCache(ctx) {
        const id = ctx.from.id;
        const number = this.storage.cache.getNumber(id);
        if (number) {
            return {
                id: id,
                number: number
            }
        } else {
            return null;
        }
    }

    checkUser(ctx) {
        const user = this.checkUserCache(ctx);
        if (!user) {
            ctx.reply("Пожалуйста, поделитесь контактом по кнопке в меню ниже", {
		    	reply_markup: {
    	    		keyboard: [
    	    			[{ text: 'Поделиться контактом', request_contact: true }]
    	    		],
    	    		resize_keyboard: true,
    	    		one_time_keyboard: true,
		    		force_reply: true
    	    	}
		    });
        }
        return user;
    }

}

export default Auth;