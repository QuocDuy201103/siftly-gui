import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

interface Contact {
  id: string;
  fullName: string;
  email: string;
  company?: string;
  message: string;
  newsletter: boolean;
  createdAt?: string;
}

export const AdminContacts = (): JSX.Element => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [filterNewsletter, setFilterNewsletter] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/status", { credentials: "include" });
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setLocation("/admin/login");
        }
      } catch (error) {
        setLocation("/admin/login");
      }
    };
    checkAuth();
  }, [setLocation]);

  // Fetch contacts
  const { data, isLoading, error } = useQuery<{ success: boolean; contacts: Contact[] }>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contacts");
      return res.json();
    },
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/contacts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete contact from ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setLocation("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    if (!data?.contacts) return [];
    
    return data.contacts.filter((contact) => {
      const matchesName = searchName === "" || 
        contact.fullName.toLowerCase().includes(searchName.toLowerCase());
      const matchesEmail = searchEmail === "" || 
        contact.email.toLowerCase().includes(searchEmail.toLowerCase());
      const matchesNewsletter = !filterNewsletter || contact.newsletter;
      const matchesDate = searchDate === "" || 
        formatDate(contact.createdAt).toLowerCase().includes(searchDate.toLowerCase());
      
      return matchesName && matchesEmail && matchesNewsletter && matchesDate;
    });
  }, [data?.contacts, searchName, searchEmail, filterNewsletter, searchDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700 text-xl">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500 text-xl">Error loading contacts: {error instanceof Error ? error.message : "Unknown error"}</div>
      </div>
    );
  }

  // Show loading or redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700 text-xl">Checking authentication...</div>
      </div>
    );
  }

  const contacts = filteredContacts;
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-[#f5f8fb] flex">
      {/* Left Sidebar */}
      <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-2 gap-6">
        <Link
          href="/"
          className="w-12 h-12 flex items-center justify-center text-white text-lg font-bold"
        >
          <img src="/figmaAssets/logo-admin.png" alt="Logo" className="w-10 h-10 object-contain" />
        </Link>
        <nav className="flex flex-col items-center w-full gap-4 text-gray-500 text-xl">
          <Link
            href="/admin/contacts"
            className="group w-full h-14 flex items-center justify-center transition duration-200 hover:bg-[linear-gradient(90deg,#00D7F0,#01A6D4)]"
          >
            <img
              src="/figmaAssets/home1.png"
              alt="Home"
              className="w-5 h-5 object-contain transition duration-200 group-hover:hidden"
            />
            <img
              src="/figmaAssets/home.png"
              alt="Home Active"
              className="w-5 h-5 object-contain transition duration-200 hidden group-hover:block"
            />
          </Link>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/notifications.png" alt="Notifications" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/security.png" alt="Security" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/user.png" alt="User" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/notifications.png" alt="Notifications" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/setting.png" alt="Settings" className="w-5 h-5 object-contain" />
          </span>
        </nav>
        {/* <button
          onClick={handleLogout}
          className="mt-auto w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center text-sm"
        >
          <img src="/figmaAssets/notifications.png" alt="Logout" className="w-5 h-5 object-contain" />
        </button> */}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="w-5 h-5 text-[#00b7ff]">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="#00b7ff" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="#00b7ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="bg-gray-100 border-none focus-visible:ring-0"
            />
          </div>
          {user && (
            <div className="flex items-center gap-3 relative">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                {/* <span className="text-xs text-gray-500">{user.email}</span> */}
              </div>
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-[#00b7ff] text-white flex items-center justify-center font-semibold hover:opacity-90 transition"
                title="User menu"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </button>
              {showUserMenu && (
                <div className="absolute top-12 right-0 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-10">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts Dashboard</h1>
            <p className="text-gray-500">Manage all contact submissions and filter insights.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-sm text-gray-500">Total Contacts</div>
              <div className="text-3xl font-bold text-[#00b7ff] mt-2">{data?.contacts.length || 0}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-sm text-gray-500">Newsletter Subscribers</div>
              <div className="text-3xl font-bold text-[#00b7ff] mt-2">
                {data?.contacts.filter((c) => c.newsletter).length || 0}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-sm text-gray-500">Recent Submissions</div>
              <div className="text-3xl font-bold text-[#00b7ff] mt-2">
                {data?.contacts.slice(0, 5).length || 0}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                type="text"
                placeholder="Search by name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="bg-gray-50"
              />
              <Input
                type="text"
                placeholder="Search by email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="bg-gray-50"
              />
              <Input
                type="text"
                placeholder="Search by date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-gray-50"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  id="newsletter"
                  checked={filterNewsletter}
                  onCheckedChange={(checked) => setFilterNewsletter(checked === true)}
                />
                Newsletter only
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {contacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {data?.contacts.length === 0 ? "No contacts found" : "No contacts match your filters"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900">Message</TableHead>
                    <TableHead className="font-semibold text-gray-900">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900">Newsletter</TableHead>
                    <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{contact.fullName}</TableCell>
                      <TableCell className="text-gray-600">{contact.email}</TableCell>
                      <TableCell className="text-gray-600 max-w-xs">
                        {truncateText(contact.message, 50)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(contact.createdAt)}
                      </TableCell>
                      <TableCell>
                        {contact.newsletter ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(contact.id, contact.fullName)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {contacts.length} of {data?.contacts.length || 0} contacts
          </div>
        </div>
      </div>
    </div>
  );
};
