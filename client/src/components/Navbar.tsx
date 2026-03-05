import { Link, useLocation } from "wouter";
import { Box, Store, Bike, LayoutDashboard } from "lucide-react";
import { HelmetIcon } from "./HelmetIcon";

export function Navbar() {
  const [location] = useLocation();

  if (location.startsWith("/courier")) {
    return null;
  }

  const links = [
    { href: "/admin", label: "Painel Admin", icon: LayoutDashboard },
    { href: "/merchant", label: "Lojista", icon: Store },
    { href: "/courier", label: "Entregador", icon: Bike },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="bg-[#ff8c00] p-2 rounded-xl text-white shadow-lg shadow-[#ff8c00]/20 group-hover:rotate-12 transition-transform">
                <Bike className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-black italic uppercase flex items-center gap-0.5">
                EntregaB<HelmetIcon className="w-5 h-5 inline-block" />y <span className="text-[#ff8c00] ml-1">delivery</span>
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const isActive = location === link.href || (location === "/" && link.href === "/admin");
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className={`
                  flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                `}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
