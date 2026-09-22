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
exports.insertRows = insertRows;
exports.updateRows = updateRows;
exports.deleteRow = deleteRow;
exports.deleteRows = deleteRows;
function insertRows(app, rowData, tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        let datastore = app.datastore();
        let table = datastore.table(tableName);
        return table.insertRows(rowData).catch((e) => {
            console.error(e);
            console.error(rowData, tableName);
            return [];
        });
    });
}
function updateRows(app, rowData, tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        let datastore = app.datastore();
        let table = datastore.table(tableName);
        return table.updateRows(rowData).catch((e) => {
            console.error("Could not update rows in " + tableName, rowData, "Because of: ", e);
            return [];
        });
    });
}
function deleteRow(app, ROWID, tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        let datastore = app.datastore();
        let table = datastore.table(tableName);
        return table.deleteRow(ROWID);
    });
}
function deleteRows(app, ROWID, tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        let datastore = app.datastore();
        let table = datastore.table(tableName);
        return table.deleteRows(ROWID);
    });
}
