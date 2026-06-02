import api from "./client";

export const createDepartment = (payload) => api.post("/departments", payload);
export const getDepartments = () => api.get("/departments");
export const seedDepartments = () => api.post("/departments/seed");
