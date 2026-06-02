import api from "./client";

export const createSalary = (payload) => api.post("/salaries", payload);
export const getSalaries = () => api.get("/salaries");
export const updateSalary = (id, payload) => api.put(`/salaries/${id}`, payload);
export const deleteSalary = (id) => api.delete(`/salaries/${id}`);
