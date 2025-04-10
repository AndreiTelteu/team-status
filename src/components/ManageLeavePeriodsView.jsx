import React, { useState } from 'react';

function ManageLeavePeriodsView({ leavePeriods, onAddLeavePeriod, onEditLeavePeriod, onDeleteLeavePeriod }) {
  const [newLeavePeriod, setNewLeavePeriod] = useState({ fromDate: '', untilDate: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ fromDate: '', untilDate: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newLeavePeriod.fromDate || !newLeavePeriod.untilDate) {
      alert('Please enter both From Date and Until Date.');
      return;
    }
    onAddLeavePeriod(newLeavePeriod);
    setNewLeavePeriod({ fromDate: '', untilDate: '' }); // Clear input after submission
  };

  const handleEditClick = (id) => {
    const leavePeriodToEdit = leavePeriods.find(lp => lp.id === id);
    setEditFormData({ 
      fromDate: leavePeriodToEdit.fromDate, 
      untilDate: leavePeriodToEdit.untilDate 
    });
    setEditingId(id);
  };

  const handleEditSubmit = (e, id) => {
    e.preventDefault();
    if (!editFormData.fromDate || !editFormData.untilDate) {
      alert('Please enter both From Date and Until Date.');
      return;
    }
    onEditLeavePeriod(id, editFormData);
    setEditingId(null);
    setEditFormData({ fromDate: '', untilDate: '' });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({ fromDate: '', untilDate: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this leave period?")) {
      onDeleteLeavePeriod(id);
    }
  };

  return (
    <div className="manage-leave-periods-view">
      <h2>Manage Leave Periods</h2>

      {/* Add Leave Period Form Section */}
      <section>
        <h3>Add New Leave Period</h3>
        <form onSubmit={handleSubmit} className="add-leave-period-form">
          <label htmlFor="fromDate">From Date:</label>
          <input
            type="date"
            id="fromDate"
            value={newLeavePeriod.fromDate}
            onChange={(e) => setNewLeavePeriod({ ...newLeavePeriod, fromDate: e.target.value })}
            required
          />
          <label htmlFor="untilDate">Until Date:</label>
          <input
            type="date"
            id="untilDate"
            value={newLeavePeriod.untilDate}
            onChange={(e) => setNewLeavePeriod({ ...newLeavePeriod, untilDate: e.target.value })}
            required
          />
          <button type="submit">Add Leave Period</button>
        </form>
      </section>

      {/* Display Current Leave Periods Section */}
      <section>
        <h3>Current Leave Periods</h3>
        {leavePeriods.length > 0 ? (
          <ul className="leave-period-list">
            {leavePeriods.map(lp => (
              <li key={lp.id}>
                {editingId === lp.id ? (
                  <form onSubmit={(e) => handleEditSubmit(e, lp.id)} className="add-leave-period-form">
                    <label htmlFor={`edit-fromDate-${lp.id}`}>From Date:</label>
                    <input
                      type="date"
                      id={`edit-fromDate-${lp.id}`}
                      value={editFormData.fromDate}
                      onChange={(e) => setEditFormData({ ...editFormData, fromDate: e.target.value })}
                      required
                    />
                    <label htmlFor={`edit-untilDate-${lp.id}`}>Until Date:</label>
                    <input
                      type="date"
                      id={`edit-untilDate-${lp.id}`}
                      value={editFormData.untilDate}
                      onChange={(e) => setEditFormData({ ...editFormData, untilDate: e.target.value })}
                      required
                    />
                    <button type="submit" style={{ backgroundColor: '#2ecc71' }}>Save</button>
                    <button 
                      type="button" 
                      onClick={handleEditCancel} 
                      style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 15px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <small>ID: {lp.id}</small>
                    &nbsp;|&nbsp;{lp.fromDate} to {lp.untilDate}
                    <button className="edit" onClick={() => handleEditClick(lp.id)}>Edit</button>
                    <button className="delete" onClick={() => handleDelete(lp.id)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No leave periods found.</p>
        )}
      </section>
    </div>
  );
}

export default ManageLeavePeriodsView;
