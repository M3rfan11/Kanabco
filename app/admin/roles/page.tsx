"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Key, 
  Users, 
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface Permission {
  id: number
  name: string
  description: string | null
  resource: string
  action: string
  createdAt: string
}

interface Role {
  id: number
  name: string
  description: string | null
  createdAt: string
  permissions?: Permission[]
}

interface User {
  id: number
  fullName: string
  email: string
  roles: string[]
}

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionsByResource, setPermissionsByResource] = useState<Record<string, Permission[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleFormData, setRoleFormData] = useState({ name: "", description: "" })
  
  // Permission assignment state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  
  // User assignment state
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Get auth token from sessionStorage (per-tab storage for testing different roles)
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("authToken") || sessionStorage.getItem("token")
    }
    return null
  }

  // Check authentication and fetch all data
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      // Redirect to admin login if not authenticated
      window.location.href = "/admin"
      return
    }
    setIsAuthenticated(true)
    fetchRoles()
    fetchPermissions()
    fetchUsers()
  }, [])

  const fetchRoles = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("No authentication token found")
      }
      
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to fetch roles"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.title || errorMessage
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        }
        
        // If 403, suggest re-login
        if (response.status === 403) {
          errorMessage = "Access denied. You need SuperAdmin role. Please log out and log back in to refresh your token."
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setRoles(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch roles"
      setError(errorMsg)
      console.error("Error fetching roles:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/permissions/by-resource`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to fetch permissions"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.title || errorMessage
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        }
        
        // If 403, suggest re-login
        if (response.status === 403) {
          errorMessage = "Access denied. You need Admin or SuperAdmin role. Please log out and log back in to refresh your token."
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Check if data is empty or invalid
      if (!data || Object.keys(data).length === 0) {
        console.warn("No permissions found in database. Permissions may need to be seeded.")
        setError("No permissions found. Please ensure permissions are seeded in the database.")
        return
      }
      
      setPermissionsByResource(data)
      
      // Flatten permissions for easy lookup
      const flatPermissions: Permission[] = []
      Object.values(data).forEach((perms) => {
        if (Array.isArray(perms) && perms.length > 0 && typeof perms[0] === 'object' && 'id' in perms[0]) {
          flatPermissions.push(...(perms as Permission[]))
        }
      })
      setPermissions(flatPermissions)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch permissions"
      setError(errorMsg)
      console.error("Error fetching permissions:", err)
      
      // If it's a 403, suggest checking user role
      if (err instanceof Error && errorMsg.includes("403")) {
        setError("Access denied. You need SuperAdmin role to manage permissions. Current error: " + errorMsg)
      }
    }
  }

  const fetchUsers = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        return // Skip if no token
      }
      
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        // Don't throw error for users - it's not critical for the page to work
        console.warn("Failed to fetch users:", response.status, response.statusText)
        return
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      // Don't set error for users fetch failure - it's not critical
      console.warn("Error fetching users:", err)
    }
  }

  const fetchRoleWithPermissions = async (roleId: number) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("No authentication token found")
      }
      
      const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/with-permissions`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to fetch role permissions"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.title || errorMessage
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        }
        console.error(`Failed to fetch role permissions for role ${roleId}:`, errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch role permissions"
      console.error("Error in fetchRoleWithPermissions:", err)
      // Don't set global error here - it's called from modal open, so we'll handle it there
      return null
    }
  }

  const handleCreateRole = async () => {
    if (!roleFormData.name.trim()) {
      setError("Role name is required")
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create role")
      }

      await fetchRoles()
      setShowRoleForm(false)
      setRoleFormData({ name: "", description: "" })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role")
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole || !roleFormData.name.trim()) {
      setError("Role name is required")
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update role")
      }

      await fetchRoles()
      setEditingRole(null)
      setRoleFormData({ name: "", description: "" })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete role")
      }

      await fetchRoles()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role")
    }
  }

  const handleOpenPermissionModal = async (role: Role) => {
    setSelectedRole(role)
    setError(null) // Clear previous errors
    
    const roleWithPerms = await fetchRoleWithPermissions(role.id)
    
    if (roleWithPerms && roleWithPerms.permissions) {
      setSelectedPermissions(new Set(roleWithPerms.permissions.map((p: Permission) => p.id)))
    } else {
      // If fetch failed, start with empty set (user can still assign permissions)
      setSelectedPermissions(new Set())
      if (!roleWithPerms) {
        setError("Could not load current permissions. You can still assign new permissions.")
      }
    }
    
    setShowPermissionModal(true)
  }

  const handleTogglePermission = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return

    try {
      const token = getAuthToken()
      
      // Get current permissions
      const roleWithPerms = await fetchRoleWithPermissions(selectedRole.id)
      const currentPermissionIds = roleWithPerms?.permissions?.map((p: Permission) => p.id) || []
      
      // Find permissions to add and remove
      const toAdd = Array.from(selectedPermissions).filter(id => !currentPermissionIds.includes(id))
      const toRemove = currentPermissionIds.filter((id: number) => !selectedPermissions.has(id))

      // Add new permissions
      for (const permissionId of toAdd) {
        await fetch(`${API_BASE_URL}/api/roles/${selectedRole.id}/permissions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ permissionId })
        })
      }

      // Remove permissions
      for (const permissionId of toRemove) {
        await fetch(`${API_BASE_URL}/api/roles/${selectedRole.id}/permissions/${permissionId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
      }

      setShowPermissionModal(false)
      setSelectedRole(null)
      setSelectedPermissions(new Set())
      await fetchRoles()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save permissions")
    }
  }

  const handleAssignRoleToUser = async (userId: number, roleId: number) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/roles`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ roleId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to assign role")
      }

      await fetchUsers()
      setError(null)
      alert("Role assigned successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign role")
    }
  }

  const handleRemoveRoleFromUser = async (userId: number, roleId: number) => {
    if (!confirm("Are you sure you want to remove this role from the user?")) {
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to remove role")
      }

      await fetchUsers()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove role")
    }
  }

  const startEdit = (role: Role) => {
    setEditingRole(role)
    setRoleFormData({
      name: role.name,
      description: role.description || ""
    })
    setShowRoleForm(true)
  }

  const cancelEdit = () => {
    setEditingRole(null)
    setRoleFormData({ name: "", description: "" })
    setShowRoleForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Role & Permission Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage roles and assign permissions to control user access
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingRole(null); setRoleFormData({ name: "", description: "" }); setShowRoleForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes("403") || error.includes("Access denied") ? (
                  <div className="mt-2 text-sm">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        sessionStorage.removeItem("authToken")
                        sessionStorage.removeItem("token")
                        window.location.href = "/admin"
                      }}
                    >
                      Log Out and Log Back In
                    </Button>
                  </div>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Form Modal */}
      {showRoleForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingRole ? "Edit Role" : "Create New Role"}</CardTitle>
            <CardDescription>
              {editingRole ? "Update role information" : "Create a new role for your system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  placeholder="e.g., ProductManager, SalesStaff"
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  placeholder="Describe what this role can do"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {role.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {role.description || "No description"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPermissionModal(role)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Permissions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(role)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteRole(role.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Assignment Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Permissions: {selectedRole.name}</CardTitle>
                  <CardDescription>
                    Select the permissions to assign to this role
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPermissionModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(permissionsByResource).map(([resource, perms]) => (
                  <div key={resource}>
                    <h3 className="font-semibold text-lg mb-3">{resource}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.has(perm.id)}
                            onChange={() => handleTogglePermission(perm.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{perm.action}</span>
                          {selectedPermissions.has(perm.id) && (
                            <Check className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSavePermissions}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Permissions
                </Button>
                <Button variant="outline" onClick={() => setShowPermissionModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Role Assignment Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Roles to Users
          </CardTitle>
          <CardDescription>
            Manage which roles are assigned to which users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold">{user.fullName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.roles.map((roleName) => {
                      const role = roles.find(r => r.name === roleName)
                      return (
                        <span
                          key={roleName}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {roleName}
                          <button
                            onClick={() => handleRemoveRoleFromUser(user.id, role?.id || 0)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      const roleId = parseInt(e.target.value)
                      if (roleId) {
                        handleAssignRoleToUser(user.id, roleId)
                        e.target.value = ""
                      }
                    }}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Assign Role...</option>
                    {roles
                      .filter(r => !user.roles.includes(r.name))
                      .map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


