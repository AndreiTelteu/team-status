import React, { useState, useEffect, useRef } from 'react';
import { getEmployees } from '../dataService';
import './UserSelector.css'; // We'll create this CSS file next

function UserSelector({ selectedUserId, onUserSelect }) {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('Select User');
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const fetchedEmployees = await getEmployees();
        setEmployees(fetchedEmployees || []); // Handle null/undefined response
        // If there's a pre-selected user ID, find their name
        if (selectedUserId) {
          const selectedEmp = fetchedEmployees?.find(emp => emp.id === selectedUserId);
          if (selectedEmp) {
            setSelectedUserName(selectedEmp.name);
          } else {
            // If selectedUserId from localStorage is invalid, clear it
            onUserSelect(null, null); // Notify parent to clear
            setSelectedUserName('Select User');
          }
        } else {
            setSelectedUserName('Select User');
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]); // Set empty array on error
        setSelectedUserName('Error loading users');
      }
    }
    fetchEmployees();
  }, [selectedUserId]); // Re-fetch or re-evaluate if selectedUserId changes externally

  useEffect(() => {
    // Close dropdown if clicked outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (employee) => {
    setSelectedUserName(employee.name);
    onUserSelect(employee.id, employee.name); // Pass ID and name up
    setIsOpen(false);
    setSearchTerm(''); // Clear search on select
  };

  const toggleDropdown = () => {
      setIsOpen(!isOpen);
      if(isOpen) setSearchTerm(''); // Clear search when closing manually
  }

  return (
    <div className="user-selector-container" ref={dropdownRef}>
      <button type="button" className="dropdown-toggle" onClick={toggleDropdown}>
        {selectedUserName} <span className={`arrow ${isOpen ? 'up' : 'down'}`}></span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <input
            type="text"
            placeholder="Search employees..."
            className="dropdown-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <ul className="dropdown-list">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <li key={employee.id} onClick={() => handleSelect(employee)}>
                  {employee.name}
                </li>
              ))
            ) : (
              <li className="no-results">No employees found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UserSelector;
