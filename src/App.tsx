import { NavLink, Route, Routes } from 'react-router-dom';
import { BackupPage } from './features/backup/BackupPage';
import { EquipmentFormPage } from './features/inventory/EquipmentFormPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { TourDetailPage } from './features/tours/TourDetailPage';
import { ToursPage } from './features/tours/ToursPage';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Outdoor Planner</h1>
        <nav className="app-nav">
          <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'active' : '')}>
            Inventar
          </NavLink>
          <NavLink to="/tours" className={({ isActive }) => (isActive ? 'active' : '')}>
            Touren
          </NavLink>
          <NavLink to="/backup" className={({ isActive }) => (isActive ? 'active' : '')}>
            Daten
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/new" element={<EquipmentFormPage />} />
          <Route path="/inventory/:id/edit" element={<EquipmentFormPage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/backup" element={<BackupPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
