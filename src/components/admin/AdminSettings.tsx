'use client'

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/services/adminService'

interface SystemSetting {
  id: string
  key: string
  value: Record<string, any>
  description?: string
  updated_at: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState({
    value: '',
    description: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settingsData = await adminService.getSystemSettings()
      setSettings(settingsData)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingSetting) return

    try {
      let parsedValue: any
      try {
        parsedValue = JSON.parse(formData.value)
      } catch {
        // If it's not valid JSON, treat it as a string
        parsedValue = { value: formData.value }
      }

      const success = await adminService.updateSystemSetting(
        editingSetting.key,
        parsedValue,
        formData.description
      )

      if (success) {
        setEditingSetting(null)
        setShowEditForm(false)
        resetForm()
        loadSettings()
        alert('Setting updated successfully!')
      } else {
        alert('Failed to update setting')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      alert('Error updating setting')
    }
  }

  const resetForm = () => {
    setFormData({
      value: '',
      description: ''
    })
  }

  const startEdit = (setting: SystemSetting) => {
    setEditingSetting(setting)
    setFormData({
      value: JSON.stringify(setting.value, null, 2),
      description: setting.description || ''
    })
    setShowEditForm(true)
  }

  const getSettingDisplayValue = (setting: SystemSetting) => {
    if (typeof setting.value === 'object') {
      return JSON.stringify(setting.value, null, 2)
    }
    return String(setting.value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <div className="text-gray-400 text-sm">
          Manage global system configuration
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {settings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No settings found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {settings.map((setting) => (
              <div key={setting.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-medium text-lg">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                    </div>
                    
                    {setting.description && (
                      <p className="text-gray-400 mb-3">
                        {setting.description}
                      </p>
                    )}
                    
                    <div className="bg-gray-700 p-3 rounded text-sm">
                      <pre className="text-gray-300 whitespace-pre-wrap">
                        {getSettingDisplayValue(setting)}
                      </pre>
                    </div>
                    
                    <div className="text-gray-500 text-sm mt-3">
                      Last updated: {new Date(setting.updated_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => startEdit(setting)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {showEditForm && editingSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Edit Setting: {editingSetting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <button
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingSetting(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleUpdateSetting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Value (JSON format)
                  </label>
                  <textarea
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    rows={8}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Enter JSON value..."
                    required
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Enter valid JSON. For simple values, use: {"{"}"value": "your_value"{"}"}
                  </p>
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
                      setShowEditForm(false)
                      setEditingSetting(null)
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
                    Update Setting
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Default Settings Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-blue-400 font-medium mb-3">Default System Settings</h3>
        <div className="text-gray-300 text-sm space-y-2">
          <p><strong>max_questions_per_test:</strong> Maximum number of questions allowed in a single test</p>
          <p><strong>default_test_duration:</strong> Default test duration in minutes</p>
          <p><strong>passing_score_threshold:</strong> Default passing score percentage</p>
          <p><strong>max_attempts_per_user:</strong> Maximum test attempts allowed per user</p>
          <p><strong>question_review_required:</strong> Whether new questions require admin review before activation</p>
        </div>
      </div>
    </div>
  )
}



