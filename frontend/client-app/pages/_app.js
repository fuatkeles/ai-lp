import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '@shared/components/theme-provider';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}