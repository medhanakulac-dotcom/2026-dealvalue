export const metadata = {
  title: "Deal Segmentation Dashboard",
  description: "Calculate deal value and auto-assign segments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
