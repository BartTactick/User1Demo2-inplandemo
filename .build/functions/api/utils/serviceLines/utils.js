"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortDates = sortDates;
function sortDates(dates, order) {
    return dates.sort((a, b) => {
        if (order === "DESC") {
            return b.getTime() - a.getTime();
        }
        return a.getTime() - b.getTime();
    });
}
