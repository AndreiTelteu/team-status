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
  // Priority options for dropdown
  const priorityOptions = ['urgent', 'high', 'medium', 'low'];
  const editorRef = useRef(null);
  const [selectedEmployees, setSelectedEmployees] = useState(() => {
    try {
      return JSON.parse(formData.employeesAssigned || '[]');
    } catch (error) {
      console.error('Error parsing employeesAssigned:', error);
      return [];
    }
  });

  // Breakdown state management
  const [breakdown, setBreakdown] = useState(() => {
    try {
      return JSON.parse(formData.breakdown || '[]');
    } catch (error) {
      console.error('Error parsing breakdown:', error);
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

  // Update breakdown when formData.breakdown changes
  useEffect(() => {
    try {
      const parsedBreakdown = JSON.parse(formData.breakdown || '[]');
      setBreakdown(parsedBreakdown);
    } catch (error) {
      console.error('Error parsing breakdown in useEffect:', error);
      setBreakdown([]);
    }
  }, [formData.breakdown]);

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

  // Breakdown management functions
  const addModule = () => {
    const newModule = {
      name: "",
      tasks: []
    };
    const updatedBreakdown = [...breakdown, newModule];
    setBreakdown(updatedBreakdown);
    setFormData({
      ...formData,
      breakdown: JSON.stringify(updatedBreakdown)
    });
  };

  const removeModule = (moduleIndex) => {
    const updatedBreakdown = breakdown.filter((_, index) => index !== moduleIndex);
    setBreakdown(updatedBreakdown);
    setFormData({
      ...formData,
      breakdown: JSON.stringify(updatedBreakdown)
    });
  };

  const updateModuleName = (moduleIndex, newName) => {
    const updatedBreakdown = breakdown.map((module, index) =>
      index === moduleIndex ? { ...module, name: newName } : module
    );
    setBreakdown(updatedBreakdown);
    setFormData({
      ...formData,
      breakdown: JSON.stringify(updatedBreakdown)
    });
  };

  const addTask = (moduleIndex) => {
    const newTask = {
      name: "",
      estimation: ""
    };
    const updatedBreakdown = breakdown.map((module, index) =>
      index === moduleIndex
        ? { ...module, tasks: [...module.tasks, newTask] }
        : module
    );
    setBreakdown(updatedBreakdown);
    setFormData({
      ...formData,
      breakdown: JSON.stringify(updatedBreakdown)
    });
  };

  const removeTask = (moduleIndex, taskIndex) => {
    const updatedBreakdown = breakdown.map((module, index) =>
      index === moduleIndex
        ? { ...module, tasks: module.tasks.filter((_, tIndex) => tIndex !== taskIndex) }
        : module
    );
    setBreakdown(updatedBreakdown);
    setFormData({
      ...formData,
      breakdown: JSON.stringify(updatedBreakdown)
    });
  };

  const updateTask = (moduleIndex, taskIndex, field, value) => {
    const updatedBreakdown = breakdown.map((module, index) =>
      index === moduleIndex
        ? {
            ...module,
            tasks: module.tasks.map((task, tIndex) =>
              tIndex === taskIndex ? { ...task, [field]: value } : task
            )
          }
        : module
    );
    setBreakdown(updatedBreakdown);
    setFormData({
      ...formData,
      breakdown: JSON.stringify(updatedBreakdown)
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="offer-form" onSubmit={handleSubmit}>
      {/* Basic form fields */}
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

      {/* Two-column layout for description and breakdown */}
      <div className="form-two-columns">
        <div className="form-column-left">
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <Editor
              id="description"
              onInit={(_, editor) => editorRef.current = editor}
              tinymceScriptSrc="/tinymce/tinymce/tinymce.min.js"
              init={{
                height: 400,
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
        </div>

        <div className="form-column-right">
          <div className="form-group">
            <div className="breakdown-header">
              <label>Project Breakdown:</label>
              <button type="button" className="add-module-btn" onClick={addModule}>
                + Add Module
              </button>
            </div>
            <div className="breakdown-container">
              {breakdown.map((module, moduleIndex) => (
                <div key={moduleIndex} className="module-item">
                  <div className="module-header">
                    <input
                      type="text"
                      value={module.name}
                      onChange={(e) => updateModuleName(moduleIndex, e.target.value)}
                      className="module-name-input"
                      placeholder="Module name"
                    />
                    <button
                      type="button"
                      className="remove-module-btn"
                      onClick={() => removeModule(moduleIndex)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="tasks-container">
                    {module.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="task-item">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => updateTask(moduleIndex, taskIndex, 'name', e.target.value)}
                          className="task-name-input"
                          placeholder="Task name"
                        />
                        <input
                          type="text"
                          value={task.estimation}
                          onChange={(e) => updateTask(moduleIndex, taskIndex, 'estimation', e.target.value)}
                          className="task-estimation-input"
                          placeholder="est. h"
                        />
                        <button
                          type="button"
                          className="remove-task-btn"
                          onClick={() => removeTask(moduleIndex, taskIndex)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-task-btn"
                      onClick={() => addTask(moduleIndex)}
                    >
                      + Add Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

      <div className="form-group">
        <label htmlFor="priority">Priority:</label>
        <select
          id="priority"
          name="priority"
          value={formData.priority || ''}
          onChange={handleChange}
        >
          <option value="">Select a priority</option>
          {priorityOptions.map(priority => (
            <option key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="estimation">Estimation:</label>
        <input
          type="text"
          id="estimation"
          name="estimation"
          value={formData.estimation || ''}
          onChange={handleChange}
          placeholder="e.g., 2 weeks, 5 days, etc."
        />
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
