import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <ProtectedRoute requireAuth={true}>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );
}