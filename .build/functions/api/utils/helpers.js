"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpers = void 0;
const date_fns_1 = require("date-fns");
exports.helpers = {
    array: {
        unique(array) {
            return [...new Set(array)];
        },
        chunk(array, chunkSize) {
            const result = [];
            for (let i = 0; i < array.length; i += chunkSize) {
                result.push(array.slice(i, i + chunkSize));
            }
            return result;
        },
        dedupeByField(array, field) {
            const hashMap = {};
            const result = [];
            for (let item of array) {
                if (!hashMap[item[field]]) {
                    hashMap[item[field]] = true;
                    result.push(item);
                }
            }
            return result;
        },
    },
    date: {
        CRMFormat(date) {
            const pad = (num) => num.toString().padStart(2, "0");
            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1);
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());
            const timezoneOffset = date.getTimezoneOffset();
            const timezoneSign = timezoneOffset > 0 ? "-" : "+";
            const timezoneHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
            const timezoneMinutes = pad(Math.abs(timezoneOffset) % 60);
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneSign}${timezoneHours}:${timezoneMinutes}`;
        },
        getDaysInMonth(date) {
            return new Date(date.getFullYear(), parseInt(date.toISOString().split("-")[1]), 0, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()).getDate();
        },
        getDaysInYear(year) {
            return exports.helpers.date.isLeapYear(year) ? 366 : 365;
        },
        isLeapYear(year) {
            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        },
        getDaysBetweenDates(date1, date2) {
            const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            const firstDate = new Date(date1);
            const secondDate = new Date(date2);
            return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
        },
        getMonthsBetweenDates(date1, date2) {
            return (0, date_fns_1.differenceInMonths)(date2, date1);
        },
        isSame(date1, date2, type) {
            date1 = new Date(date1);
            date2 = new Date(date2);
            if (type == "date") {
                date1.setHours(0, 0, 0, 0);
                date2.setHours(0, 0, 0, 0);
            }
            return date1.toISOString() == date2.toISOString();
        },
    },
    number: {
        formatBytes(bytes, decimals = 2) {
            if (bytes === 0 || isNaN(bytes))
                return "0 Bytes";
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
        },
        twoDecimals(number) {
            return parseFloat(number.toFixed(2));
        },
    },
    object: {
        deepFind(obj, path) {
            let paths = path.split("."), current = obj, i;
            for (i = 0; i < paths.length; ++i) {
                if (current[paths[i]] == undefined) {
                    return undefined;
                }
                else {
                    current = current[paths[i]];
                }
            }
            return current;
        },
    },
};
