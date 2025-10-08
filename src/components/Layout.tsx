import { Link, useLocation } from "react-router-dom";
import { Home, FileText, GraduationCap, Hash, BarChart3, Bell, User } from "lucide-react";
import { Button } from "./ui/button";

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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card border-4 border-secondary shadow-md">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">PARLIAMENT OF GHANA</h1>
                <p className="text-sm text-secondary font-semibold">Interactive Hansard System</p>
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

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-light">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="secondary" className="gap-2 font-semibold">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </div>
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
