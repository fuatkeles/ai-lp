import ProtectedRoute from '../components/ProtectedRoute';
import LoginForm from '../components/LoginForm';

export default function Login() {
  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen gradient-bg-subtle">
        <LoginForm />
      </div>
    </ProtectedRoute>
  );
}