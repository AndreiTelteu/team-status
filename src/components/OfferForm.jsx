import React, { useState, useEffect } from 'react';

function OfferForm({
  formData,
  setFormData,
  clients,
  employees,
  statusOptions,
  onSubmit,
  onCancel,
  isEditing
}) {
  const [selectedEmployees, setSelectedEmployees] = useState(() => {
    try {
      return JSON.parse(formData.employeesAssigned || '[]');
    } catch (error) {
      console.error('Error parsing employeesAssigned:', error);
      return [];
    }
  });

  // Update selectedEmployees when formData.employeesAssigned changes
  useEffect(() => {
    try {
      const parsedEmployees = JSON.parse(formData.employeesAssigned || '[]');
      setSelectedEmployees(parsedEmployees);
    } catch (error) {
      console.error('Error parsing employeesAssigned in useEffect:', error);
      setSelectedEmployees([]);
    }
  }, [formData.employeesAssigned]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle employee selection changes
  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    let updatedEmployees;

    if (selectedEmployees.includes(employeeId)) {
      // Remove employee if already selected
      updatedEmployees = selectedEmployees.filter(id => id !== employeeId);
    } else {
      // Add employee if not already selected
      updatedEmployees = [...selectedEmployees, employeeId];
    }

    setSelectedEmployees(updatedEmployees);
    setFormData({
      ...formData,
      employeesAssigned: JSON.stringify(updatedEmployees)
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="offer-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="clientId">Client:</label>
        <select
          id="clientId"
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
          required
        >
          <option value="">Select a client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="projectName">Project Name:</label>
        <input
          type="text"
          id="projectName"
          name="projectName"
          value={formData.projectName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          placeholder="Enter project description"
        />
      </div>

      <div className="form-group">
        <label htmlFor="requestDate">Request Date:</label>
        <input
          type="date"
          id="requestDate"
          name="requestDate"
          value={formData.requestDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Employees Assigned:</label>
        <div className="employees-selection">
          {employees.map(employee => (
            <div key={employee.id} className="employee-checkbox">
              <input
                type="checkbox"
                id={`employee-${employee.id}`}
                value={employee.id}
                checked={selectedEmployees.includes(employee.id)}
                onChange={handleEmployeeChange}
              />
              <label htmlFor={`employee-${employee.id}`}>{employee.name}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="status">Status:</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-button">
          {isEditing ? 'Update Offer' : 'Add Offer'}
        </button>
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default OfferForm;
