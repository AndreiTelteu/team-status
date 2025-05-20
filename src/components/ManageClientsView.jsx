import React, { useState } from 'react';

function ManageClientsView({ clients, onAddClient, onDeleteClient }) {
  const [newClientName, setNewClientName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      alert('Please enter a client name.');
      return;
    }
    onAddClient(newClientName.trim());
    setNewClientName(''); // Clear input after submission
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete client "${name}"?`)) {
      onDeleteClient(id, name);
    }
  };

  return (
    <div className="manage-clients-view">
      <h2>Manage Clients</h2>

      {/* Add Client Form Section */}
      <section>
        <h3>Add New Client</h3>
        <form onSubmit={handleSubmit} className="add-client-form">
          <label htmlFor="clientName">Client Name:</label>
          <input
            type="text"
            id="clientName"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="Enter client name"
            required
          />
          <button type="submit">Add Client</button>
        </form>
      </section>

      {/* Display Current Clients Section */}
      <section>
        <h3>Current Clients</h3>
        {clients.length > 0 ? (
          <ul className="client-list">
            {clients.map(client => (
              <li key={client.id}>
                {client.name}
                <button
                  className="delete-button"
                  onClick={() => handleDelete(client.id, client.name)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No clients found.</p>
        )}
      </section>
    </div>
  );
}

export default ManageClientsView;
