"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const fixServicePricing_1 = __importDefault(require("../fixServicePricing"));
const helpers_1 = require("../helpers");
const _3_generateNormalLines_1 = require("./3.generateNormalLines");
function sortASCByDateKey(key) {
    return (a, b) => a[key].getTime() - b[key].getTime();
}
function default_1(lines, mutations, mutationMinDate, serviceDate, creditLines, serviceStartDate, serviceEndDate) {
    const sortedLines = lines.sort(sortASCByDateKey("startDate"));
    let newLines = [];
    const firstMutation = mutations[0];
    for (const line of sortedLines) {
        if (line.startDate < mutationMinDate) {
            line.discount = firstMutation.Previous_Discount;
            line.quantity = firstMutation.Previous_Quantity;
            line.listPrice = firstMutation.Previous_Amount;
            line.territoryPrice = firstMutation.Previous_Internal_Rate;
            line.vendorPrice = firstMutation.Previous_Purchase_Price;
        }
    }
    if (sortedLines[0] &&
        sortedLines[0].startDate > mutationMinDate &&
        !sortedLines[0].origin.startsWith("C")) {
        const mutation = mutations.find((mutation) => {
            return helpers_1.helpers.date.isSame(mutation.Effective_from, mutationMinDate, "date");
        });
        if (mutation) {
            sortedLines.unshift(Object.assign(Object.assign({}, sortedLines[0]), { startDate: mutationMinDate, endDate: sortedLines[0].startDate, origin: sortedLines[0].origin + "-M" }));
        }
    }
    // console.log(sortedLines);
    for (let index = 0; index < lines.length; index++) {
        const periodLine = sortedLines[index];
        const previousMutation = mutations
            .filter((mutation) => {
            return mutation.Effective_from > periodLine.startDate;
        })
            .sort(sortASCByDateKey("Effective_from"))
            .pop();
        if (previousMutation) {
            periodLine.discount = previousMutation.Previous_Discount;
            periodLine.quantity = previousMutation.Previous_Quantity;
            periodLine.listPrice = previousMutation.Previous_Amount;
            periodLine.territoryPrice = previousMutation.Previous_Internal_Rate;
            periodLine.vendorPrice = previousMutation.Previous_Purchase_Price;
        }
        const findMutationsInPeriodLine = mutations
            .filter((mutation) => {
            return (periodLine.startDate <= mutation.Effective_from &&
                periodLine.endDate > mutation.Effective_from);
        })
            .sort(sortASCByDateKey("Effective_from"));
        if (findMutationsInPeriodLine.length == 0) {
            if (!helpers_1.helpers.date.isSame(periodLine.startDate, periodLine.endDate, "date"))
                newLines.push(periodLine);
            continue;
        }
        const firstMutation = findMutationsInPeriodLine[0];
        // console.log(firstMutation);
        // console.log(periodLine);
        if (!helpers_1.helpers.date.isSame(firstMutation.Effective_from, periodLine.startDate, "date") &&
            !creditLines.find((e) => helpers_1.helpers.date.isSame(e.startDate, firstMutation.Effective_from, "date"))) {
            const beforeMutationLine = Object.assign(Object.assign({}, periodLine), { startDate: new Date(periodLine.startDate), endDate: new Date(firstMutation.Effective_from), origin: "MB", originID: "M_" + firstMutation.id });
            (0, fixServicePricing_1.default)(beforeMutationLine);
            newLines.push(beforeMutationLine);
        }
        for (let i = 0; i < findMutationsInPeriodLine.length; i++) {
            const mutation = findMutationsInPeriodLine[i], nextMutation = findMutationsInPeriodLine[i + 1];
            if (helpers_1.helpers.date.isSame((nextMutation === null || nextMutation === void 0 ? void 0 : nextMutation.Effective_from) || periodLine.endDate, mutation.Effective_from, "date")) {
                continue;
            }
            // console.log(mutation.Effective_from, lastDate);
            const mutationLine = {
                startDate: mutation.Effective_from,
                endDate: (nextMutation === null || nextMutation === void 0 ? void 0 : nextMutation.Effective_from) || periodLine.endDate,
                billingPeriod: periodLine.billingPeriod,
                contractEndDate: periodLine.contractEndDate,
                origin: "M",
                originID: "M_" + mutation.id,
                service: periodLine.service,
                discount: mutation.New_Discount,
                listPrice: mutation.New_Amount,
                quantity: mutation.New_Quantity,
                territoryPrice: mutation.New_Internal_Rate,
                vendorPrice: mutation.New_Purchase_Price,
            };
            newLines.push(mutationLine);
            for (let i = index; i < lines.length; i++) {
                for (const key of [
                    "discount",
                    "listPrice",
                    "quantity",
                    "territoryPrice",
                    "vendorPrice",
                ])
                    lines[i][key] = mutationLine[key];
            }
        }
    }
    for (const newLine of newLines) {
        const amountOfMonthsIsDifferend = _3_generateNormalLines_1.monthAmounts[lines[0].billingPeriod] !=
            helpers_1.helpers.date.getMonthsBetweenDates(newLine.startDate, newLine.endDate);
        const amountOfMonthsInServicePeriodIsMoreThanPeriod = _3_generateNormalLines_1.monthAmounts[lines[0].billingPeriod] <
            helpers_1.helpers.date.getMonthsBetweenDates(serviceStartDate, serviceEndDate);
        const isMonthlyAndDifferendDate = amountOfMonthsInServicePeriodIsMoreThanPeriod &&
            amountOfMonthsIsDifferend;
        // console.log(
        //   isMonthlyAndDifferendDate,
        //   amountOfMonthsInServicePeriodIsMoreThanPeriod,
        //   amountOfMonthsIsDifferend,
        //   [
        //     monthAmounts[lines[0].billingPeriod],
        //     helpers.date.getMonthsBetweenDates(serviceStartDate, serviceEndDate),
        //     helpers.date.getMonthsBetweenDates(newLine.startDate, newLine.endDate),
        //   ],
        // );
        if (isMonthlyAndDifferendDate ||
            (serviceDate.getDate() != newLine.startDate.getDate() &&
                helpers_1.helpers.date.getDaysInMonth(newLine.startDate) !=
                    newLine.startDate.getDate() &&
                amountOfMonthsIsDifferend) ||
            (serviceDate.getDate() != newLine.startDate.getDate() &&
                newLine.origin.startsWith("M"))) {
            (0, fixServicePricing_1.default)(newLine, true);
        }
    }
    return newLines;
}
