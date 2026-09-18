"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTax = getTax;
exports.totalExVatHours = totalExVatHours;
exports.totalExVatCharge = totalExVatCharge;
exports.totalExVatService = totalExVatService;
function getTax(Tax_Percentage = 0, total = 0) {
    return ((Tax_Percentage || 0) / 100) * total;
}
function totalExVatHours(hour) {
    return parseFloat(hour.timeDelta + "") * (hour.pricePerHour || 0);
}
function totalExVatCharge(charge) {
    return ((charge.quantity || 0) * (charge.listPrice || 0) -
        (charge.discount || 0));
}
function totalExVatService(service) {
    return (service.quantity * (service.listPrice || 0) - (service.discount || 0));
}
