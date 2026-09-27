import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Modal from '../components/Modal';
import styles from './Offices.module.css';

interface Office {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

export default function Offices() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', latitude: '', longitude: '', radius: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/offices');
      const data = await res.json();
      setOffices(data);
    } catch (error) {
      console.error('Error fetching offices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radius: parseInt(formData.radius, 10),
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', latitude: '', longitude: '', radius: '' });
        fetchOffices(); // refresh list
      }
    } catch (error) {
      console.error('Error creating office:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Offices</h2>
        <button className="premium-btn" onClick={() => setIsModalOpen(true)}>Add New Office</button>
      </div>

      <div className={`glass-panel ${styles.tableContainer}`}>
        {loading ? (
          <p>Loading offices...</p>
        ) : (
          <table className={styles.premiumTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Radius (m)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offices.map((office) => (
                <tr key={office.id}>
                  <td>{office.name}</td>
                  <td>{office.latitude}</td>
                  <td>{office.longitude}</td>
                  <td>{office.radius}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${office.is_active ? styles.active : styles.inactive}`}>
                      {office.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.actionBtn}>Edit</button>
                  </td>
                </tr>
              ))}
              {offices.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>No offices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Office">
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Office Name</label>
            <input 
              required 
              type="text" 
              className="premium-input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Latitude</label>
              <input 
                required 
                type="number" 
                step="any"
                className="premium-input" 
                value={formData.latitude}
                onChange={e => setFormData({...formData, latitude: e.target.value})} 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Longitude</label>
              <input 
                required 
                type="number" 
                step="any"
                className="premium-input" 
                value={formData.longitude}
                onChange={e => setFormData({...formData, longitude: e.target.value})} 
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Radius (meters)</label>
            <input 
              required 
              type="number" 
              className="premium-input" 
              value={formData.radius}
              onChange={e => setFormData({...formData, radius: e.target.value})} 
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" className="premium-btn" style={{background: 'var(--text-secondary)'}} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="premium-btn" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Office'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
