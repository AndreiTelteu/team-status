import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

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
  const editorRef = useRef(null);
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

  // Handle TinyMCE editor content changes
  const handleEditorChange = (content) => {
    setFormData({
      ...formData,
      description: content
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
        <Editor
          id="description"
          onInit={(_, editor) => editorRef.current = editor}
          tinymceScriptSrc="/tinymce/tinymce/tinymce.min.js"
          init={{
            height: 300,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            branding: false,
            promotion: false
          }}
          value={formData.description}
          onEditorChange={handleEditorChange}
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
