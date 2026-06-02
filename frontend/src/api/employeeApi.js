import api from "./client";

export const createEmployee = (payload) => api.post("/employees", payload);
export const getEmployees = () => api.get("/employees");
