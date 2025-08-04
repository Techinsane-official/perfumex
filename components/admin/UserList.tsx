"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  UserCheck,
  UserX,
  Link as LinkIcon,
  Activity,
} from "lucide-react";
import { AccessUrlDialog } from "@/components/ui/AccessUrlDialog";
import { UserActivityDialog } from "@/components/ui/UserActivityDialog";

interface User {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "BUYER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserListProps {
  /** @internal placeholder to satisfy lint rules */
  _placeholder?: true;
}

export function UserList({}: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [accessUrlDialog, setAccessUrlDialog] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
  }>({
    isOpen: false,
    userId: "",
    username: "",
  });
  const [activityDialog, setActivityDialog] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
  }>({
    isOpen: false,
    userId: "",
    username: "",
  });

  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUsers(data.pagination?.total || 0);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Weet u zeker dat u deze gebruiker wilt verwijderen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the user list
        fetchUsers();
        alert("Gebruiker succesvol verwijderd");
      } else {
        const error = await response.json();
        alert(`Fout bij verwijderen: ${error.error || "Onbekende fout"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de gebruiker");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        // Refresh the user list
        fetchUsers();
        alert(`Gebruiker ${!currentStatus ? "geactiveerd" : "gedeactiveerd"}`);
      } else {
        const error = await response.json();
        alert(`Fout bij status wijzigen: ${error.error || "Onbekende fout"}`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Er is een fout opgetreden bij het wijzigen van de gebruiker status");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL");
  };

  const getRoleLabel = (role: string) => {
    return role === "ADMIN" ? "Beheerder" : "Koper";
  };

  const getRoleColor = (role: string) => {
    return role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <UserCheck className="w-4 h-4 text-green-600" />
    ) : (
      <UserX className="w-4 h-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Zoek Gebruikers
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                id="search"
                placeholder="Zoek op gebruikersnaam of email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              id="role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              <option value="">Alle Rollen</option>
              <option value="ADMIN">Beheerder</option>
              <option value="BUYER">Koper</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              <option value="">Alle Statussen</option>
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Toon {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, totalUsers)} van {totalUsers} gebruikers
        </p>
        <Link
          href="/admin/users/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nieuwe Gebruiker</span>
        </Link>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gebruiker
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aangemaakt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(user.isActive)}
                    <span
                      className={`text-sm ${user.isActive ? "text-green-600" : "text-red-600"}`}
                    >
                      {user.isActive ? "Actief" : "Inactief"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setActivityDialog({
                          isOpen: true,
                          userId: user.id,
                          username: user.username,
                        })
                      }
                      className="inline-flex items-center justify-center p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                      title="Activiteit bekijken"
                    >
                      <Activity className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setAccessUrlDialog({
                          isOpen: true,
                          userId: user.id,
                          username: user.username,
                        })
                      }
                      className="inline-flex items-center justify-center p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                      title="Toegangs-URL genereren"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      className="inline-flex items-center justify-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                      title={user.isActive ? "Deactiveren" : "Activeren"}
                    >
                      {user.isActive ? (
                        <UserX className="h-5 w-5" />
                      ) : (
                        <UserCheck className="h-5 w-5" />
                      )}
                    </button>
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="inline-flex items-center justify-center p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                      title="Bewerken"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                      title="Verwijderen"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vorige
            </button>
            <span className="text-sm text-gray-700">
              Pagina {currentPage} van {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volgende
            </button>
          </div>
        </div>
      )}
      <AccessUrlDialog
        isOpen={accessUrlDialog.isOpen}
        onClose={() => setAccessUrlDialog({ ...accessUrlDialog, isOpen: false })}
        userId={accessUrlDialog.userId}
        username={accessUrlDialog.username}
      />
      <UserActivityDialog
        isOpen={activityDialog.isOpen}
        onClose={() => setActivityDialog({ ...activityDialog, isOpen: false })}
        userId={activityDialog.userId}
        username={activityDialog.username}
      />
    </div>
  );
}
