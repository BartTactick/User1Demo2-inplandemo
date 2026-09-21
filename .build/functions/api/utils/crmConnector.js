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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCRMToken = getCRMToken;
exports.COQLQuery = COQLQuery;
exports.COQLQueryAll = COQLQueryAll;
exports.createItems = createItems;
exports.CRMUpsert = CRMUpsert;
exports.getItemByID = getItemByID;
exports.updateItemByID = updateItemByID;
exports.updateItems = updateItems;
exports.deleteItems = deleteItems;
exports.getAttachments = getAttachments;
exports.downloadCRMFile = downloadCRMFile;
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const os_1 = require("os");
function getCRMToken(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const { CRM_CLIENT_ID, CRM_CLIENT_SECRET, CRM_REFRESH_TOKEN } = process.env;
        // const connector = app
        //   .connection({
        //     CRM: {
        //       client_id: CRM_CLIENT_ID as string,
        //       client_secret: CRM_CLIENT_SECRET as string,
        //       auth_url: "https://accounts.zoho.eu/oauth/v2/token",
        //       refresh_url: "https://accounts.zoho.eu/oauth/v2/token",
        //       refresh_token: CRM_REFRESH_TOKEN as string,
        //     },
        //   })
        //   .getConnector("CRM");
        const connector = yield app.connections().getConnectionCredentials("crm");
        console.log(connector);
        return connector.headers["Authorization"];
    });
}
function COQLQuery(app, select_query) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const queryResult = yield axios_1.default
            .post(CRM_API + "/crm/v8/coql", { select_query }, {
            headers: {
                Authorization: token,
            },
        })
            .catch((e) => {
            var _a;
            console.error("Could not query:", select_query);
            console.error(((_a = e.response) === null || _a === void 0 ? void 0 : _a.data) || e.response || e);
            return [];
        });
        if (Array.isArray(queryResult))
            return queryResult;
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function COQLQueryAll(app, select_query) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = [], page = 1;
        while (true) {
            const queryRes = yield COQLQuery(app, select_query + " LIMIT 2000 offset " + (page - 1) * 2000).catch((e) => console.error(e));
            if (queryRes == null)
                return [];
            result = result.concat(queryRes);
            page++;
            if (queryRes.length != 2000)
                break;
        }
        // console.log(result);
        return result;
    });
}
function createItems(app, module, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const queryResult = yield axios_1.default
            .post(CRM_API + "/crm/v5/" + module + "", {
            data,
            trigger: ["approval", "workflow", "blueprint"],
        }, {
            headers: {
                Authorization: token,
            },
        })
            .catch((error) => {
            var _a;
            console.error("Could not create:", JSON.stringify(((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || (error === null || error === void 0 ? void 0 : error.response) || error, null, 2), {
                data,
                trigger: ["approval", "workflow", "blueprint"],
            });
            return [];
        });
        if (Array.isArray(queryResult))
            return queryResult;
        // console.log({ queryResult });
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function CRMUpsert(app, module, data, checkFields) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const queryResult = yield axios_1.default
            .post(CRM_API + "/crm/v5/" + module + "/upsert", {
            data,
            trigger: ["approval", "workflow", "blueprint"],
            duplicate_check_fields: checkFields,
        }, {
            headers: {
                Authorization: token,
            },
        })
            .catch((error) => {
            var _a;
            console.error("Could not upsert:", JSON.stringify(((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || (error === null || error === void 0 ? void 0 : error.response) || error, null, 2), {
                data,
                trigger: ["approval", "workflow", "blueprint"],
                duplicate_check_fields: checkFields,
            });
            return [];
        });
        if (Array.isArray(queryResult))
            return queryResult;
        // console.log({ queryResult });
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function getItemByID(app, module, id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const queryResult = yield axios_1.default
            .get(CRM_API + "/crm/v5/" + module + "/" + id, {
            headers: {
                Authorization: token,
            },
        })
            .catch((error) => {
            var _a;
            console.error("Could not fetch:", {
                module,
                id,
            }, ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || (error === null || error === void 0 ? void 0 : error.response) || error);
            return [];
        });
        // console.log({ queryResult });
        if (Array.isArray(queryResult))
            return queryResult;
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function updateItemByID(app, module, id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        data.id = id;
        const queryResult = yield axios_1.default
            .put(CRM_API + "/crm/v5/" + module, { data: [data], trigger: ["approval", "workflow", "blueprint"] }, {
            headers: {
                Authorization: token,
            },
        })
            .catch((error) => {
            var _a, _b, _c;
            console.error("Could not update:", {
                module,
                id,
                data,
            }, ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.data) ||
                ((_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) ||
                (error === null || error === void 0 ? void 0 : error.response) ||
                error);
            return [];
        });
        if (Array.isArray(queryResult))
            return queryResult;
        // console.log({ queryResult });
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function updateItems(app, module, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const queryResult = yield axios_1.default
            .put(CRM_API + "/crm/v5/" + module, { data, trigger: ["approval", "workflow", "blueprint"] }, {
            headers: {
                Authorization: token,
            },
        })
            .catch((error) => {
            var _a, _b, _c;
            console.error("Could not fetch:", {
                module,
                data,
            }, ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.data) ||
                ((_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) ||
                (error === null || error === void 0 ? void 0 : error.response) ||
                error);
            return [];
        });
        if (Array.isArray(queryResult))
            return queryResult;
        // console.log({ queryResult });
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function deleteItems(app, module, ids) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const queryResult = yield axios_1.default
            .delete(CRM_API + "/crm/v5/" + module + "?wf_trigger=true&ids=" + ids, {
            headers: {
                Authorization: token,
            },
        })
            .catch((error) => {
            var _a, _b, _c;
            console.error("Could not delete:", {
                module,
                ids,
            }, ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.data) ||
                ((_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) ||
                (error === null || error === void 0 ? void 0 : error.response) ||
                error);
            return [];
        });
        if (Array.isArray(queryResult))
            return queryResult;
        // console.log({ queryResult });
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function getAttachments(app, module, id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const queryResult = yield axios_1.default
            .get(CRM_API + "/crm/v5/" + module + "/" + id + "/Attachments", {
            headers: {
                Authorization: token,
            },
            params: {
                fields: "$file_id,File_Name",
            },
        })
            .catch((error) => {
            var _a;
            console.error("Could not fetch:", {
                module,
                id,
            }, ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || (error === null || error === void 0 ? void 0 : error.response) || error);
            return [];
        });
        if (Array.isArray(queryResult))
            return queryResult;
        // console.log({ queryResult });
        return ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a.data) || [];
    });
}
function downloadCRMFile(app, fileID) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getCRMToken(app);
        const { CRM_API } = process.env;
        const responseResponse = yield axios_1.default
            .get(CRM_API + "/crm/v6/files?id=" + fileID, {
            headers: {
                Authorization: token,
            },
            responseType: "stream",
        })
            .catch((error) => {
            var _a;
            console.error("Could not fetch:", ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || (error === null || error === void 0 ? void 0 : error.response) || error);
            return [];
        });
        if (responseResponse == null || Array.isArray(responseResponse))
            return "";
        const tmpdirectory = (0, os_1.tmpdir)();
        const path = tmpdirectory + "/" + fileID + ".pdf";
        const writer = (0, fs_1.createWriteStream)(path);
        // Pipe the response stream to the file
        responseResponse.data.pipe(writer);
        // Return a promise that resolves when the file is finished downloading
        return new Promise((resolve, reject) => {
            writer.on("finish", () => resolve(path));
            writer.on("error", reject);
        });
    });
}
