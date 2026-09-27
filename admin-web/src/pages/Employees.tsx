import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Modal from '../components/Modal';
import styles from './Employees.module.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  office_id: number | null;
  is_active: boolean;
}

interface Office {
  id: number;
  name: string;
}

export default function Employees() {
  const [users, setUsers] = useState<User[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', office_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, officesRes] = await Promise.all([
        fetch('http://localhost:8000/api/users'),
        fetch('http://localhost:8000/api/offices')
      ]);
      const usersData = await usersRes.json();
      const officesData = await officesRes.json();
      
      setUsers(usersData);
      setOffices(officesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          office_id: formData.office_id ? parseInt(formData.office_id, 10) : null,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'employee', office_id: '' });
        fetchData(); // refresh list
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getOfficeName = (officeId: number | null) => {
    if (!officeId) return 'Unassigned';
    const office = offices.find(o => o.id === officeId);
    return office ? office.name : 'Unknown';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Employees</h2>
        <button className="premium-btn" onClick={() => setIsModalOpen(true)}>Add New Employee</button>
      </div>

      <div className={`glass-panel ${styles.tableContainer}`}>
        {loading ? (
          <p>Loading employees...</p>
        ) : (
          <table className={styles.premiumTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Office</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>{user.name.charAt(0)}</div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td className={styles.capitalize}>{user.role}</td>
                  <td>{getOfficeName(user.office_id)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${user.is_active ? styles.active : styles.inactive}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.actionBtn}>Edit</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Employee">
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input 
              required 
              type="text" 
              className="premium-input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Email</label>
            <input 
              required 
              type="email" 
              className="premium-input" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input 
              required 
              type="password" 
              className="premium-input" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Role</label>
              <select 
                className="premium-input"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>Assigned Office</label>
              <select 
                className="premium-input"
                value={formData.office_id}
                onChange={e => setFormData({...formData, office_id: e.target.value})}
              >
                <option value="">-- None --</option>
                {offices.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="button" className="premium-btn" style={{background: 'var(--text-secondary)'}} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="premium-btn" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
