'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/hooks/useAuth'

interface AdminItem {
  id: number
  name: string
  email: string
  createdAt?: string
}

export default function AdminsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('adminToken')
      if (!token) return
      fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setAdmins(data.admins || []))
        .finally(() => setLoading(false))
    }
  }, [isAuthenticated])

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const token = localStorage.getItem('adminToken')
    if (!token) return
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setAdmins(prev => [{ id: data.id, name: data.name, email: data.email }, ...prev])
      setForm({ name: '', email: '', password: '' })
      setMessage('Administrator je kreiran')
      setTimeout(() => setMessage(''), 2000)
    } else {
      const err = await res.json().catch(() => ({}))
      setMessage(err.message || 'Failed to create admin')
    }
    setSaving(false)
  }

  const deleteAdmin = async (id: number) => {
    if (!confirm('Obrisati ovog administratora?')) return
    const token = localStorage.getItem('adminToken')
    if (!token) return
    const res = await fetch(`/api/admin/admins/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setAdmins(prev => prev.filter(a => a.id !== id))
    }
  }

  const startEdit = (admin: AdminItem) => {
    setEditingAdmin(admin)
    setEditForm({ name: admin.name, email: admin.email, password: '' })
  }

  const updateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return
    setSaving(true)
    const token = localStorage.getItem('adminToken')
    if (!token) return
    const updateData: { name?: string; email?: string; password?: string } = {}
    if (editForm.name !== editingAdmin.name) updateData.name = editForm.name
    if (editForm.email !== editingAdmin.email) updateData.email = editForm.email
    if (editForm.password) updateData.password = editForm.password
    
    const res = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updateData),
    })
    if (res.ok) {
      const data = await res.json()
      setAdmins(prev => prev.map(a => a.id === editingAdmin.id ? { ...a, name: data.name, email: data.email } : a))
      setEditingAdmin(null)
      setMessage('Administrator je ažuriran')
      setTimeout(() => setMessage(''), 2000)
    } else {
      const err = await res.json().catch(() => ({}))
      setMessage(err.message || 'Greška pri ažuriranju')
    }
    setSaving(false)
  }

  if (authLoading || loading) {
    return (
      <AdminLayout title="Administratori" description="Upravljanje administratorima">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Administratori" description="Upravljanje administratorima">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <form onSubmit={createAdmin} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="admin-name" className="block text-sm font-medium text-gray-700 mb-1">Ime</label>
              <input
                id="admin-name"
                name="adminName"
                type="text"
                className="border rounded px-3 py-2 w-full"
                placeholder="Ime"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">E-pošta</label>
              <input
                id="admin-email"
                name="adminEmail"
                type="email"
                className="border rounded px-3 py-2 w-full"
                placeholder="E-pošta"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">Lozinka</label>
              <input
                id="admin-password"
                name="adminPassword"
                type="password"
                className="border rounded px-3 py-2 w-full"
                placeholder="Lozinka"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded disabled:opacity-50">
              {saving ? 'Kreiranje...' : 'Kreiraj administratora'}
            </button>
          </div>
          {message && <div className="text-sm text-green-600">{message}</div>}
        </form>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-sm text-gray-600">Ime</th>
                <th className="px-4 py-3 text-sm text-gray-600">E-pošta</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(a)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Uredi</button>
                    <button onClick={() => deleteAdmin(a.id)} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Obriši</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Uredi administratora</h3>
              <form onSubmit={updateAdmin} className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">Ime</label>
                  <input
                    id="edit-name"
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">E-pošta</label>
                  <input
                    id="edit-email"
                    type="email"
                    className="border rounded px-3 py-2 w-full"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-1">Nova lozinka (ostavi prazno za zadržati postojeću)</label>
                  <input
                    id="edit-password"
                    type="password"
                    className="border rounded px-3 py-2 w-full"
                    value={editForm.password}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {saving ? 'Spremanje...' : 'Spremi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


