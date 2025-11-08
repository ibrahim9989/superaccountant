'use client'

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/services/adminService'
import { getSupabaseClient } from '@/lib/supabase/client'

interface TestConfiguration {
  id: string
  name: string
  description: string
  total_questions: number
  time_limit_minutes: number
  passing_score_percentage: number
  max_attempts: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminTestConfigs() {
  const [configs, setConfigs] = useState<TestConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<TestConfiguration | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_questions: 10,
    time_limit_minutes: 60,
    passing_score_percentage: 70,
    max_attempts: 3
  })

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('test_configurations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading test configurations:', error)
        return
      }

      setConfigs(data || [])
    } catch (error) {
      console.error('Error loading test configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Configuration name is required')
      return
    }

    try {
      const success = await adminService.createTestConfiguration(formData)
      if (success) {
        setShowCreateForm(false)
        resetForm()
        loadConfigs()
        alert('Test configuration created successfully!')
      } else {
        alert('Failed to create test configuration')
      }
    } catch (error) {
      console.error('Error creating test configuration:', error)
      alert('Error creating test configuration')
    }
  }

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingConfig) return

    try {
      const success = await adminService.updateTestConfiguration(editingConfig.id, formData)
      if (success) {
        setEditingConfig(null)
        setShowCreateForm(false)
        resetForm()
        loadConfigs()
        alert('Test configuration updated successfully!')
      } else {
        alert('Failed to update test configuration')
      }
    } catch (error) {
      console.error('Error updating test configuration:', error)
      alert('Error updating test configuration')
    }
  }

  const handleToggleActive = async (configId: string, isActive: boolean) => {
    try {
      const success = await adminService.updateTestConfiguration(configId, { is_active: !isActive })
      if (success) {
        loadConfigs()
        alert(`Test configuration ${!isActive ? 'activated' : 'deactivated'} successfully!`)
      } else {
        alert('Failed to update test configuration')
      }
    } catch (error) {
      console.error('Error updating test configuration:', error)
      alert('Error updating test configuration')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      total_questions: 10,
      time_limit_minutes: 60,
      passing_score_percentage: 70,
      max_attempts: 3
    })
  }

  const startEdit = (config: TestConfiguration) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      description: config.description,
      total_questions: config.total_questions,
      time_limit_minutes: config.time_limit_minutes,
      passing_score_percentage: config.passing_score_percentage,
      max_attempts: config.max_attempts
    })
    setShowCreateForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading test configurations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Test Configuration Management</h2>
        <button
          onClick={() => {
            setShowCreateForm(true)
            setEditingConfig(null)
            resetForm()
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add New Configuration
        </button>
      </div>

      {/* Configurations List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {configs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No test configurations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {configs.map((config) => (
              <div key={config.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-medium text-lg">
                        {config.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        config.is_active ? 'bg-green-600' : 'bg-red-600'
                      } text-white`}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {config.description && (
                      <p className="text-gray-400 mb-3">
                        {config.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Questions:</span>
                        <span className="text-white ml-2">{config.total_questions}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time Limit:</span>
                        <span className="text-white ml-2">{config.time_limit_minutes} min</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Passing Score:</span>
                        <span className="text-white ml-2">{config.passing_score_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Max Attempts:</span>
                        <span className="text-white ml-2">{config.max_attempts}</span>
                      </div>
                    </div>
                    
                    <div className="text-gray-500 text-sm mt-3">
                      Created: {new Date(config.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => startEdit(config)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(config.id, config.is_active)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        config.is_active 
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {config.is_active ? 'Deactivate' : 'Activate'}
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
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingConfig ? 'Edit Test Configuration' : 'Create New Test Configuration'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingConfig(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={editingConfig ? handleUpdateConfig : handleCreateConfig} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Configuration Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter configuration name..."
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total Questions *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.total_questions}
                      onChange={(e) => setFormData({...formData, total_questions: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time Limit (minutes) *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={formData.time_limit_minutes}
                      onChange={(e) => setFormData({...formData, time_limit_minutes: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Passing Score (%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passing_score_percentage}
                      onChange={(e) => setFormData({...formData, passing_score_percentage: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Attempts *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({...formData, max_attempts: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingConfig(null)
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
                    {editingConfig ? 'Update Configuration' : 'Create Configuration'}
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
