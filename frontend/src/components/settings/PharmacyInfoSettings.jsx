import React, { useState, useEffect } from 'react'
import { getPharmacySettings, updatePharmacySettings } from '../../services/settingsService'

const PharmacyInfoSettings = () => {
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'KES',
    taxRate: 0,
    businessReg: '',
    watermarkEnabled: true,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPharmacySettings()
        setSettings(data)
      } catch (err) {
        console.error('Failed to fetch pharmacy settings', err)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await updatePharmacySettings(settings)
      setMessage('Pharmacy settings updated successfully')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Pharmacy Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Pharmacy Name</label>
          <input
            type="text"
            name="name"
            value={settings.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Address</label>
          <textarea
            name="address"
            value={settings.address}
            onChange={handleChange}
            rows="2"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Phone</label>
            <input
              type="text"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Currency (e.g., KES)</label>
            <input
              type="text"
              name="currency"
              value={settings.currency}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              name="taxRate"
              value={settings.taxRate}
              onChange={handleChange}
              step="0.01"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Business Registration / PIN</label>
          <input
            type="text"
            name="businessReg"
            value={settings.businessReg}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="watermarkEnabled"
            checked={settings.watermarkEnabled}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-gray-700">Enable watermark on printed documents</label>
        </div>
        {message && (
          <p className={`${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PharmacyInfoSettings