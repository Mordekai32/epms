import { useEffect, useState } from "react";
import { getDepartments } from "../api/departmentApi";
import { createEmployee, getEmployees } from "../api/employeeApi";

function EmployeePage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    employeeNumber: "",
    firstName: "",
    lastName: "",
    position: "",
    address: "",
    telephone: "",
    gender: "Male",
    hiredDate: "",
    departmentId: "",
  });

  const loadData = async () => {
    const [deptRes, empRes] = await Promise.all([getDepartments(), getEmployees()]);
    setDepartments(deptRes.data);
    setEmployees(empRes.data);
  };

  useEffect(() => {
    loadData().catch(() => setMessage("Failed to load employees"));
  }, []);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const telephone = form.telephone.trim();
    const hiredDate = new Date(form.hiredDate);
    if (!/^[A-Za-z ]{2,50}$/.test(firstName) || !/^[A-Za-z ]{2,50}$/.test(lastName)) {
      setMessage("First name and last name should contain only letters (2-50 chars)");
      return;
    }
    if (!/^[0-9+\- ]{7,20}$/.test(telephone)) {
      setMessage("Telephone should contain valid digits (7-20 chars)");
      return;
    }
    if (Number.isNaN(hiredDate.getTime()) || hiredDate > new Date()) {
      setMessage("Hired date cannot be in the future");
      return;
    }
    try {
      await createEmployee({
        ...form,
        firstName,
        lastName,
        telephone,
      });
      setMessage("Employee saved");
      setForm({
        employeeNumber: "",
        firstName: "",
        lastName: "",
        position: "",
        address: "",
        telephone: "",
        gender: "Male",
        hiredDate: "",
        departmentId: "",
      });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save employee");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold text-blue-900">Employee Form</h2>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <input
            name="employeeNumber"
            className="rounded-md border px-3 py-2"
            placeholder="Employee Number"
            value={form.employeeNumber}
            onChange={onChange}
            minLength={2}
            required
          />
          <input
            name="firstName"
            className="rounded-md border px-3 py-2"
            placeholder="First Name"
            value={form.firstName}
            onChange={onChange}
            pattern="[A-Za-z ]{2,50}"
            title="Use only letters (2-50 characters)"
            required
          />
          <input
            name="lastName"
            className="rounded-md border px-3 py-2"
            placeholder="Last Name"
            value={form.lastName}
            onChange={onChange}
            pattern="[A-Za-z ]{2,50}"
            title="Use only letters (2-50 characters)"
            required
          />
          <input
            name="position"
            className="rounded-md border px-3 py-2"
            placeholder="Position"
            value={form.position}
            onChange={onChange}
            minLength={2}
            required
          />
          <input
            name="address"
            className="rounded-md border px-3 py-2 md:col-span-2"
            placeholder="Address"
            value={form.address}
            onChange={onChange}
            minLength={3}
            required
          />
          <input
            name="telephone"
            className="rounded-md border px-3 py-2"
            placeholder="Telephone"
            value={form.telephone}
            onChange={onChange}
            pattern="[0-9+\- ]{7,20}"
            title="Use 7-20 digits (plus and dash allowed)"
            required
          />
          <select
            name="gender"
            className="rounded-md border px-3 py-2"
            value={form.gender}
            onChange={onChange}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input
            type="date"
            name="hiredDate"
            className="rounded-md border px-3 py-2"
            value={form.hiredDate}
            onChange={onChange}
            max={new Date().toISOString().split("T")[0]}
            required
          />
          <select
            name="departmentId"
            className="rounded-md border px-3 py-2"
            value={form.departmentId}
            onChange={onChange}
            required
          >
            <option value="">Select department</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.departmentCode} - {dept.departmentName}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800 md:col-span-2">
            Save Employee
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </section>

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold text-blue-900">Saved Employees</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left">Number</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Position</th>
                <th className="p-2 text-left">Department</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((item) => (
                <tr key={item._id} className="border-b">
                  <td className="p-2">{item.employeeNumber}</td>
                  <td className="p-2">
                    {item.firstName} {item.lastName}
                  </td>
                  <td className="p-2">{item.position}</td>
                  <td className="p-2">{item.department?.departmentName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default EmployeePage;
