export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground print:hidden">
      <p>© {new Date().getFullYear()} RCCG Emmanuel Sanctuary. All rights reserved.</p>
      <p className="mt-0.5">Attendance Management System v1.0</p>
    </footer>
  );
}
