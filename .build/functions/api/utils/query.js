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
exports.executeQuery = executeQuery;
exports.executeGETALLQuery = executeGETALLQuery;
function executeQuery(app_1, query_1) {
    return __awaiter(this, arguments, void 0, function* (app, query, parseFirstKey = true) {
        const zcql = app.zcql();
        const result = yield zcql.executeZCQLQuery(query);
        if (result.length == 0)
            return [];
        const firstKey = Object.keys(result[0])[0];
        if (parseFirstKey)
            return result.map((e) => e[firstKey]);
        else
            return result;
    });
}
function executeGETALLQuery(app, query) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = [], page = 1;
        while (true) {
            const queryRes = yield executeQuery(app, query + " LIMIT " + (page - 1) * 300 + ",300", false).catch((e) => {
                console.error(e);
                console.error({ query });
            });
            if (queryRes == null)
                return [];
            result = result.concat(queryRes);
            page++;
            if (queryRes.length != 300)
                break;
        }
        return result;
    });
}
