import api from "./client";

export const getMonthlyPayrollReport = (month) =>
  api.get("/reports/monthly-payroll", { params: { month } });
