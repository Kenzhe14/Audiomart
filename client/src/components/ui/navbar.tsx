import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { ShoppingCart, UserCircle } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";
import Cart from "./cart";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Button variant="link" className="text-xl font-bold p-0">
            AudioTech
          </Button>
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="gap-4">
            <NavigationMenuItem>
              <ThemeSwitcher />
            </NavigationMenuItem>

            {user?.isAdmin && (
              <NavigationMenuItem>
                <Link href="/admin/products">
                  <Button variant="ghost">Admin</Button>
                </Link>
              </NavigationMenuItem>
            )}

            <NavigationMenuItem>
              <Cart />
            </NavigationMenuItem>

            <NavigationMenuItem>
              {user ? (
                <div className="flex items-center gap-2">
                  <UserCircle className="w-6 h-6" />
                  <span>{user.username}</span>
                  <Button
                    variant="ghost"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button>Login</Button>
                </Link>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}