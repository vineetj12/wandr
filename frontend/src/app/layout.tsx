import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/Toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wandr — AI Travel Planner',
  description:
    'Plan your perfect trip with AI-powered itineraries. Wandr uses Gemini AI to build personalized day-by-day travel plans in seconds.',
  keywords: 'travel planner, AI itinerary, trip planning, Gemini AI',
  openGraph: {
    title: 'Wandr — AI Travel Planner',
    description: 'AI-powered travel itineraries in seconds',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
