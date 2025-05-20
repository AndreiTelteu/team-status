import React, { useState, useEffect } from 'react';
import { getOffers, addOffer, updateOffer, deleteOffer, getClients, getEmployees } from '../dataService';
import OfferForm from './OfferForm';

function ManageOffersView() {
  const [offers, setOffers] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    projectName: '',
    description: '',
    requestDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    employeesAssigned: '[]', // JSON string of employee IDs
    status: 'New' // Default status
  });

  // Status options for dropdown
  const statusOptions = [
    'New',
    'In Progress',
    'Pending Client',
    'Accepted',
    'Rejected',
    'Completed'
  ];

  // Fetch offers, clients, and employees on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [offersData, clientsData, employeesData] = await Promise.all([
          getOffers(),
          getClients(),
          getEmployees()
        ]);
        setOffers(offersData || []);
        setClients(clientsData || []);
        setEmployees(employeesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle form submission for adding a new offer
  const handleAddOffer = async (offerData) => {
    try {
      const newOffer = await addOffer(offerData);
      if (newOffer) {
        setOffers([newOffer, ...offers]);
        resetForm(); // This will also hide the form
        // Refetch data
        const updatedOffers = await getOffers();
        setOffers(updatedOffers || []);
        // Show a success message
        // alert('Offer added successfully!');
      }
    } catch (error) {
      console.error('Error adding offer:', error);
      alert('Error adding offer. Please try again.');
    }
  };

  // Handle form submission for updating an offer
  const handleUpdateOffer = async (id, offerData) => {
    try {
      const updatedOffer = await updateOffer(id, offerData);
      if (updatedOffer) {
        setOffers(offers.map(offer => offer.id === id ? updatedOffer : offer));
        resetForm(); // This will also hide the form and clear editingOfferId
        // Refetch data
        const updatedOffers = await getOffers();
        setOffers(updatedOffers || []);
        // Show a success message
        // alert('Offer updated successfully!');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Error updating offer. Please try again.');
    }
  };

  // Handle deleting an offer
  const handleDeleteOffer = async (id) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(id);
        setOffers(offers.filter(offer => offer.id !== id));
      } catch (error) {
        console.error('Error deleting offer:', error);
      }
    }
  };

  // Handle edit button click
  const handleEditClick = (offer) => {
    setEditingOfferId(offer.id);
    setFormData({
      clientId: offer.clientId,
      projectName: offer.projectName,
      description: offer.description || '',
      requestDate: offer.requestDate,
      employeesAssigned: offer.employeesAssigned || '[]',
      status: offer.status
    });
    setShowForm(true); // Always show form when editing
  };

  // Toggle form visibility
  const toggleForm = () => {
    if (editingOfferId) {
      // If currently editing, reset the form
      resetForm();
    } else {
      // Otherwise just toggle the form visibility
      setShowForm(!showForm);
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      clientId: '',
      projectName: '',
      description: '',
      requestDate: new Date().toISOString().split('T')[0],
      employeesAssigned: '[]',
      status: 'New'
    });
    setEditingOfferId(null);
    setShowForm(false); // Hide form when resetting
  };

  // Handle form cancel
  const handleCancel = () => {
    resetForm();
  };

  // Format the employees assigned list for display
  const formatEmployeesList = (employeesJson, allEmployees) => {
    try {
      const employeeIds = JSON.parse(employeesJson || '[]');
      if (!employeeIds.length) return 'None';

      return employeeIds
        .map(id => {
          const employee = allEmployees.find(emp => emp.id === id);
          return employee ? employee.name : 'Unknown';
        })
        .join(', ');
    } catch (error) {
      console.error('Error parsing employees JSON:', error);
      return 'Error';
    }
  };

  if (loading) {
    return <div>Loading offers data...</div>;
  }

  return (
    <div className="manage-offers-view">
      <h2>Manage Offers</h2>

      {/* Add/Edit Offer Form Section */}
      <section className="form-section">
        <div className="section-header">
          <h3>{editingOfferId ? 'Edit Offer' : 'Add New Offer'}</h3>
          <button
            className={`toggle-form-button ${showForm ? 'active' : ''}`}
            onClick={toggleForm}
          >
            {showForm ? 'Cancel' : (editingOfferId ? 'Cancel Edit' : 'Add Offer')}
          </button>
        </div>

        {showForm && (
          <div className="form-container">
            <OfferForm
              formData={formData}
              setFormData={setFormData}
              clients={clients}
              employees={employees}
              statusOptions={statusOptions}
              onSubmit={editingOfferId
                ? () => handleUpdateOffer(editingOfferId, formData)
                : () => handleAddOffer(formData)
              }
              onCancel={handleCancel}
              isEditing={!!editingOfferId}
            />
          </div>
        )}
      </section>

      {/* Offers List */}
      <section>
        <h3>Offers List</h3>
        {offers.length > 0 ? (
          <div className="offers-list">
            <table className="offers-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Request Date</th>
                  <th>Employees Assigned</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => (
                  <tr key={offer.id} className={editingOfferId === offer.id ? 'editing' : ''}>
                    <td>{offer.clientName}</td>
                    <td>{offer.projectName}</td>
                    <td>{offer.requestDate}</td>
                    <td>{formatEmployeesList(offer.employeesAssigned, employees)}</td>
                    <td>
                      <span className={`status-badge status-${offer.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {offer.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(offer)}
                        disabled={editingOfferId === offer.id}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteOffer(offer.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No offers found. Add your first offer using the form above.</p>
        )}
      </section>
    </div>
  );
}

export default ManageOffersView;
