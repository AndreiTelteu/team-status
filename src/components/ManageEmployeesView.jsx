import React, { useState } from 'react';

function ManageEmployeesView({ employees, onAddEmployee, onDeleteEmployee }) {
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) {
      alert('Please enter an employee name.');
      return;
    }
    onAddEmployee(newEmployeeName.trim());
    setNewEmployeeName(''); // Clear input after submission
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete employee "${name}"?`)) {
      onDeleteEmployee(id, name);
    }
  };

  return (
    <div className="manage-employees-view"> {/* Added class */}
      <h2>Manage Employees</h2>

      {/* Add Employee Form Section */}
      <section>
        <h3>Add New Employee</h3>
        {/* Added class "add-employee-form" */}
        <form onSubmit={handleSubmit} className="add-employee-form">
          <label htmlFor="employeeName">Employee Name:</label>
          <input
            type="text"
            id="employeeName"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder="Enter name"
            required
          />
          <button type="submit">Add Employee</button>
        </form>
      </section>

      {/* Display Current Employees Section */}
      <section>
        <h3>Current Employees</h3>
        {employees.length > 0 ? (
          <ul className="employee-list"> {/* Added class */}
            {employees.map(emp => (
              <li key={emp.id}>
                {emp.name}
                <button
                  className="delete-button"
                  onClick={() => handleDelete(emp.id, emp.name)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No employees found.</p>
        )}
      </section>
    </div>
  );
}

export default ManageEmployeesView;
