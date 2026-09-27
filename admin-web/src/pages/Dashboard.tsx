import { useEffect, useState } from 'react';

import styles from './Dashboard.module.css';

interface Stats {
  present: number;
  late: number;
  absent: number;
}

interface Activity {
  id: number;
  user_name: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ present: 0, late: 0, absent: 0 });
  const [recent, setRecent] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        fetch('http://localhost:8000/api/attendances/stats'),
        fetch('http://localhost:8000/api/attendances/recent')
      ]);
      const statsData = await statsRes.json();
      const recentData = await recentRes.json();
      
      setStats(statsData);
      setRecent(recentData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading statistics...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h2>Today's Overview</h2>
      
      <div className={styles.statsGrid}>
        <div className={`glass-panel ${styles.statCard}`}>
          <h3>Total Present</h3>
          <div className={styles.statValue}>{stats.present}</div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <h3>Late</h3>
          <div className={`${styles.statValue} ${styles.warning}`}>{stats.late}</div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <h3>Absent</h3>
          <div className={`${styles.statValue} ${styles.danger}`}>{stats.absent}</div>
        </div>
      </div>
      
      <div className={`glass-panel ${styles.recentActivity}`}>
        <h3>Recent Activity</h3>
        {recent.length === 0 ? (
          <p className={styles.mockText}>No recent activity found.</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.premiumTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((record) => (
                  <tr key={record.id}>
                    <td>{record.user_name}</td>
                    <td>{record.date}</td>
                    <td>{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'}</td>
                    <td>{record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[record.status] || ''}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
