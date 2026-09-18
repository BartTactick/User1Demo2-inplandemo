import { differenceInMonths } from "date-fns";

export const helpers = {
  array: {
    unique(array: any[]) {
      return [...new Set(array)];
    },

    chunk<T>(array: T[], chunkSize: number) {
      const result = [];

      for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
      }

      return result;
    },

    dedupeByField(array: any[], field: string) {
      const hashMap: { [key: string]: any } = {};
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
    CRMFormat(date: Date) {
      const pad = (num: number) => num.toString().padStart(2, "0");

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
    getDaysInMonth(date: Date) {
      return new Date(
        date.getFullYear(),
        parseInt(date.toISOString().split("-")[1]),
        0,
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds(),
      ).getDate();
    },
    getDaysInYear(year: number): number {
      return helpers.date.isLeapYear(year) ? 366 : 365;
    },

    isLeapYear(year: number): boolean {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    },
    getDaysBetweenDates(date1: Date, date2: Date): number {
      const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      const firstDate = new Date(date1);
      const secondDate = new Date(date2);

      return Math.round(
        Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay),
      );
    },
    getMonthsBetweenDates(date1: Date, date2: Date) {
      return differenceInMonths(date2, date1);
    },
    isSame(date1: Date, date2: Date, type: "date" | "datetime") {
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
    formatBytes(bytes: number, decimals: number = 2): string {
      if (bytes === 0 || isNaN(bytes)) return "0 Bytes";

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    twoDecimals(number: number) {
      return parseFloat(number.toFixed(2));
    },
  },
  object: {
    deepFind(obj: { [key: string]: any }, path: string) {
      let paths = path.split("."),
        current = obj,
        i;

      for (i = 0; i < paths.length; ++i) {
        if (current[paths[i]] == undefined) {
          return undefined;
        } else {
          current = current[paths[i]];
        }
      }
      return current;
    },
  },
};
