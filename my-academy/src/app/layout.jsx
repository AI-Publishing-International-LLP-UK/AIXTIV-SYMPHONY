import { ThemeProvider } from '../contexts/ThemeContext.jsx';
import '../styles/themes.css';
import './globals.css';

export const metadata = {
  title: 'Academy',
  description: 'Learning platform for educational content',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
