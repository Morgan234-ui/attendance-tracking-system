"use client";

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from 'sonner';

export default function Providers({ children }) {
	return (
		<SessionProvider>
			<ThemeProvider>
				<AuthProvider>
					<AppProvider>
						{children}
						<Toaster
							position="top-right"
							richColors
							closeButton
							toastOptions={{
								duration: 4000,
							}}
						/>
					</AppProvider>
				</AuthProvider>
			</ThemeProvider>
		</SessionProvider>
	);
}

