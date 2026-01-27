"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate12MonthsData = generate12MonthsData;
async function generate12MonthsData(model) {
    const last12Months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthYear = startDate.toLocaleString("default", {
            month: "short",
            year: "numeric",
        });
        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        });
        last12Months.push({ month: monthYear, count });
    }
    return { last12Months };
}
