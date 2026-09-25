import { Outlet, useNavigate, Link } from 'react-router-dom';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}></div>
          <h2>HR Admin</h2>
        </div>
        
        <nav className={styles.nav}>
          <Link to="/" className={styles.navItem}>Dashboard</Link>
          {/* <Link to="/offices" className={styles.navItem}>Offices</Link>
          <Link to="/employees" className={styles.navItem}>Employees</Link> */}
        </nav>
        
        <div className={styles.logoutWrapper}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <h1>Attendance System</h1>
          <div className={styles.profile}>Admin User</div>
        </header>
        
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
