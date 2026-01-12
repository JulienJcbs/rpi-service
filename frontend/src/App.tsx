import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DevicesPage from './pages/DevicesPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import GroupsPage from './pages/GroupsPage';
import EventsPage from './pages/EventsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="devices/:id" element={<DeviceDetailPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;



