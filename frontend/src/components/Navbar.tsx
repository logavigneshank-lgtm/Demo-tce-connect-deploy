import { Calendar, MessageCircle, Menu, X, User, LogOut, Settings, LayoutDashboard, Trophy } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { clearAuth, getUserRole } from "@/lib/auth";

const navItems: { icon: any; label: string; path: string }[] = [
  { icon: Trophy, label: "Winners", path: "/winners" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const logoPath = isAuthenticated
    ? userRole === "organizer"
      ? "/organizer-dashboard"
      : "/student-dashboard"
    : "/login";

  const checkAuth = () => {
    const authStatus = localStorage.getItem("tce_isAuthenticated");
    const email = localStorage.getItem("tce_user_email");
    const role = localStorage.getItem("tce_user_role");
    setIsAuthenticated(authStatus === "true");
    setUserEmail(email || "");
    setUserRole(role || "");
  };

  useEffect(() => {
    // Check auth on mount and whenever location changes
    checkAuth();
  }, [location]);

  useEffect(() => {
    // Listen for storage changes (including custom events)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check on navigation/focus
    window.addEventListener("focus", checkAuth);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();

    toast.success("Logged out successfully", {
      description: "See you again soon!",
    });

    setIsAuthenticated(false);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const handleDashboard = () => {
    setMobileMenuOpen(false);
    const role = getUserRole();
    if (role === "student") {
      navigate("/student-dashboard");
    } else if (userRole === "organizer") {
      navigate("/organizer-dashboard");
    }
  };

  return (
    <nav className="bg-white/95 text-foreground shadow-lg sticky top-0 z-50 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Enhanced for Mobile */}
          <Link to="/events" className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:bg-primary/20 transition-all"></div>
              <img
                src="/tce-logo.png"
                alt="TCE Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="text-base sm:text-lg font-bold flex items-center gap-1 sm:gap-2">
              <span className="text-primary group-hover:scale-110 transition-transform duration-300">TCE</span>
              <span className="text-foreground transition-all duration-300 hidden xs:inline">Connect</span>
            </div>
          </Link>

          {/* Desktop Navigation - Improved */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className="px-4 py-1.5 rounded-lg text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all duration-300 font-medium border border-transparent text-sm"
                activeClassName="text-primary font-bold border-primary bg-transparent"
              >
                <span>{item.label}</span>
              </NavLink>
            ))}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="ml-2"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userEmail}</p>
                      <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDashboard}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="ml-2">
                <a href="/login">Login</a>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button - Improved with Badge */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-primary hidden xs:inline">{userRole}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-primary/10 transition-all duration-300 hover:scale-110 rounded-xl h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6 rotate-90 transition-transform duration-300" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Improved with Better UX */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 space-y-1 animate-slide-up border-t border-border bg-white/95 backdrop-blur-md">
            {/* User Info Card - Mobile */}
            {isAuthenticated && (
              <div className="mx-2 mb-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{userEmail}</p>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                      {userRole}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            {navItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all duration-300 mx-2 font-medium border border-transparent text-sm group"
                activeClassName="text-primary font-bold border-primary/30 bg-primary/5"
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <div className="h-px bg-border mx-2 my-2"></div>

                <button
                  onClick={handleDashboard}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all duration-300 mx-2 font-medium text-sm group"
                >
                  <LayoutDashboard className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all duration-300 mx-2 font-medium text-sm group"
                >
                  <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/settings");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all duration-300 mx-2 font-medium text-sm group"
                >
                  <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Settings</span>
                </button>

                <div className="h-px bg-border mx-2 my-2"></div>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 mx-2 font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-border mx-2 my-2"></div>
                <a
                  href="/login"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg transition-all duration-300 mx-2 font-semibold text-sm btn-shine hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
