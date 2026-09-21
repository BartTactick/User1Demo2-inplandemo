"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const crmConnector_1 = require("./crmConnector");
function default_1(app, amountOfWindows) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetch = yield (0, crmConnector_1.getItemByID)(app, "Defaults", "323558000023156713");
        const duration = Number(fetch[0].Waarde) * amountOfWindows;
        const durationCappedAt30Minutes = Math.ceil(duration / 30) * 30;
        return durationCappedAt30Minutes;
    });
}
