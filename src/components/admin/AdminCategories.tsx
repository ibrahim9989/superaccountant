'use client'

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/services/adminService'
import { getSupabaseClient } from '@/lib/supabase/client'

interface QuestionCategory {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<QuestionCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading categories:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Category name is required')
      return
    }

    try {
      const success = await adminService.createCategory(formData.name, formData.description)
      if (success) {
        setShowCreateForm(false)
        resetForm()
        loadCategories()
        alert('Category created successfully!')
      } else {
        alert('Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Error creating category')
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCategory) return

    try {
      const success = await adminService.updateCategory(editingCategory.id, formData)
      if (success) {
        setEditingCategory(null)
        setShowCreateForm(false)
        resetForm()
        loadCategories()
        alert('Category updated successfully!')
      } else {
        alert('Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error updating category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all questions in this category.')) return

    try {
      const success = await adminService.deleteCategory(categoryId)
      if (success) {
        loadCategories()
        alert('Category deleted successfully!')
      } else {
        alert('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
  }

  const startEdit = (category: QuestionCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description
    })
    setShowCreateForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading categories...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Category Management</h2>
        <button
          onClick={() => {
            setShowCreateForm(true)
            setEditingCategory(null)
            resetForm()
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add New Category
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No categories found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {categories.map((category) => (
              <div key={category.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg mb-2">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-400 mb-3">
                        {category.description}
                      </p>
                    )}
                    <div className="text-gray-500 text-sm">
                      Created: {new Date(category.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => startEdit(category)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingCategory(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingCategory(null)
                      resetForm()
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
