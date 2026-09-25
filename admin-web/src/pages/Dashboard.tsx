import { useEffect, useState } from 'react';
import api from '../utils/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [data, setData] = useState({ present: 0, late: 0, absent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For MVP, we mock the stats as the API endpoint is not yet created.
    setTimeout(() => {
      setData({ present: 45, late: 12, absent: 3 });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading statistics...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h2>Today's Overview</h2>
      
      <div className={styles.statsGrid}>
        <div className={`glass-panel ${styles.statCard}`}>
          <h3>Total Present</h3>
          <div className={styles.statValue}>{data.present}</div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <h3>Late</h3>
          <div className={`${styles.statValue} ${styles.warning}`}>{data.late}</div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <h3>Absent</h3>
          <div className={`${styles.statValue} ${styles.danger}`}>{data.absent}</div>
        </div>
      </div>
      
      <div className={`glass-panel ${styles.recentActivity}`}>
        <h3>Recent Activity (Mock)</h3>
        <p className={styles.mockText}>Attendance records table will be displayed here.</p>
      </div>
    </div>
  );
}
