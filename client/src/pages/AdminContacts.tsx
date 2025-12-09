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
  _id: string;
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center font-bold text-lg">
              S
            </div>
            <span className="text-xl font-semibold">Siftly Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/">
                <a className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                  Home
                </a>
              </Link>
            </li>
            <li>
              <Link href="/admin/contacts">
                <a className="block px-4 py-2 rounded bg-gray-700 font-semibold">
                  Contacts
                </a>
              </Link>
            </li>
            {/* <li>
              <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                Settings
              </a>
            </li> */}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          {user && (
            <div className="mb-4">
              {/* {user.picture && (
                // <img
                //   src={user.picture}
                //   alt={user.name}
                //   className="w-10 h-10 rounded-full mx-auto mb-2"
                // />
              )} */}
              <p className="text-sm text-center text-gray-300 truncate">{user.name}</p>
              <p className="text-xs text-center text-gray-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-8">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Contacts</h1>

          {/* Filter/Search Bar */}
          <div className="mb-6 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="text"
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="newsletter"
                checked={filterNewsletter}
                onCheckedChange={(checked) => setFilterNewsletter(checked === true)}
              />
              <label htmlFor="newsletter" className="text-sm font-medium text-gray-700 cursor-pointer">
                Newsletter Only
              </label>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="text"
                placeholder="Search by date..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Table */}
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {data?.contacts.length === 0 ? "No contacts found" : "No contacts match your filters"}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">NAME</TableHead>
                    <TableHead className="font-semibold text-gray-900">EMAIL</TableHead>
                    <TableHead className="font-semibold text-gray-900">MESSAGE</TableHead>
                    <TableHead className="font-semibold text-gray-900">SUBMITTED DATE</TableHead>
                    <TableHead className="font-semibold text-gray-900">NEWSLETTER</TableHead>
                    <TableHead className="font-semibold text-gray-900">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact._id} className="hover:bg-gray-50">
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
                          onClick={() => handleDelete(contact._id, contact.fullName)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {contacts.length} of {data?.contacts.length || 0} contacts
          </div>
        </div>
      </div>
    </div>
  );
};
