import { Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, Hash, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import logo from "@/assets/logo.png";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Hansard", icon: Home },
    { path: "/space", label: "Space", icon: Hash },
    { path: "/education", label: "Education", icon: GraduationCap },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-4 border-secondary bg-primary shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Parliament of Ghana Logo" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-primary-bright tracking-tight">PARLIAMENT OF GHANA</h1>
                <p className="text-sm text-primary-foreground font-medium">Interactive Hansard System</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={`gap-2 ${isActive(item.path) ? 'text-primary font-bold' : 'text-primary-foreground hover:bg-primary-light'}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-4 border-secondary bg-primary shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "secondary" : "ghost"}
                className={`w-full flex-col h-auto py-2 gap-1 ${isActive(item.path) ? 'text-primary font-bold' : 'text-primary-foreground'}`}
                size="sm"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
