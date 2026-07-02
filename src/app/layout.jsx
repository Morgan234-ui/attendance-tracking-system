import '@/styles/global.css';
import Providers from '@/components/providers';

export const metadata = {
  title: 'USAMS - Uniport Student Attendance Management System',
  description: 'A modern web-based Student Attendance Management System for universities',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}