"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hoursQueue = void 0;
exports.setupQueue = setupQueue;
function setupQueue() {
    const requests = [];
    let running = false;
    function checkQue() {
        if (running)
            return;
        const request = requests.shift();
        if (request == undefined)
            return;
        running = true;
        const { res, next } = request;
        res.on("close", () => {
            running = false;
            checkQue();
        });
        next();
    }
    return ((req, res, next) => {
        requests.push({
            req,
            res,
            next,
        });
        checkQue();
    });
}
exports.hoursQueue = setupQueue();
