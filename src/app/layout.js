import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Da Logistics Manager",
  description: "Logistics management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
