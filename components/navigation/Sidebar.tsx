// components/navigation/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { db } from '@/lib/firebase';
import { Pet } from '@/types';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot 
} from 'firebase/firestore';
import { 
  Home,
  Settings,
  PawPrint,
  Calendar,
  Pill,
  Weight,
  Clock,
  FileText,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddPetDialog } from '../dialogs/AddPetDialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Sidebar() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'pets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const petsData: Pet[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        petsData.push({ id: doc.id, ...doc.data() } as Pet);
      });
      setPets(petsData);

      if (!selectedPet && petsData.length > 0) {
        setSelectedPet(petsData[0].id);
      }
    });

    return () => unsubscribe();
  }, [user, selectedPet]);

  useEffect(() => {
    const match = pathname.match(/\/pets\/([^/]+)/);
    if (match && match[1]) {
      setSelectedPet(match[1]);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut('/');
    } catch {
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Could not sign out. Please try again.",
      });
    }
  };

  const handlePetSelect = (petId: string) => {
    setSelectedPet(petId);
    router.push(`/pets/${petId}`);
    setIsMobileOpen(false);
  };

  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const petSections = [
    { name: 'Overview', href: `/pets/${selectedPet}`, icon: PawPrint },
    { name: 'Appointments', href: `/pets/${selectedPet}/appointments`, icon: Calendar },
    { name: 'Medications', href: `/pets/${selectedPet}/medications`, icon: Pill },
    { name: 'Weight Tracking', href: `/pets/${selectedPet}/weight`, icon: Weight },
    { name: 'Feeding Schedule', href: `/pets/${selectedPet}/feeding`, icon: Clock },
    { name: 'Notes', href: `/pets/${selectedPet}/notes`, icon: FileText },
  ];

  const SidebarContent = () => (
    <div className={cn(
      "h-full flex flex-col bg-card transition-all duration-300",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* User Profile Section */}
      <div className={cn(
        "p-4 border-b flex items-center gap-3",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8">
              {user?.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="font-medium text-sm truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed ? "rotate-180" : ""
          )} />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-4">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isCollapsed ? "px-3" : "",
                          isActive && "bg-accent"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
                        {!isCollapsed && item.name}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>

          {/* Pets Section */}
          <div className="space-y-2">
            <div className={cn(
              "flex items-center px-3 py-1",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              {!isCollapsed && (
                <h2 className="text-sm font-semibold tracking-tight">
                  My Pets
                </h2>
              )}
              <AddPetDialog>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </AddPetDialog>
            </div>

            <nav className="space-y-1">
              {pets.map((pet) => {
                const isActive = selectedPet === pet.id;
                
                return (
                  <Tooltip key={pet.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isCollapsed ? "px-3" : "",
                          isActive && "bg-accent"
                        )}
                        onClick={() => handlePetSelect(pet.id)}
                      >
                        <PawPrint className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
                        {!isCollapsed && pet.name}
                      </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        {pet.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          {/* Pet Sections */}
          {selectedPet && pathname.includes('/pets/') && (
            <div className="space-y-2">
              {!isCollapsed && (
                <h2 className="px-3 text-sm font-semibold tracking-tight">
                  Pet Details
                </h2>
              )}
              <nav className="space-y-1">
                {petSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = pathname === section.href;
                  
                  return (
                    <Tooltip key={section.name} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            isCollapsed ? "px-3" : "",
                            isActive && "bg-accent"
                          )}
                          onClick={() => {
                            router.push(section.href);
                            setIsMobileOpen(false);
                          }}
                        >
                          <Icon className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
                          {!isCollapsed && section.name}
                        </Button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          {section.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-3" : ""
              )}
              onClick={handleLogout}
            >
              <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
              {!isCollapsed && "Sign out"}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              Sign out
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden",
          isMobileOpen ? "block" : "hidden"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Sidebar Content */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background transform transition-transform duration-200 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen flex-col border-r bg-card fixed">
        <SidebarContent />
      </div>

      {/* Spacer for desktop layout */}
      <div className={cn(
        "hidden md:block transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )} />
    </>
  );
}