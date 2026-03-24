import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import ProfileSettings from '../components/settings/ProfileSettings'
import UserManagement from '../components/settings/UserManagement'
import PharmacyInfoSettings from '../components/settings/PharmacyInfoSettings'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useSelector((state) => state.auth)
  const canManageUsers = user?.role === 'admin' || user?.role === 'manager'
  const canEditPharmacy = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 px-1 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Profile
          </button>
          {canManageUsers && (
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 px-1 ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Users
            </button>
          )}
          {canEditPharmacy && (
            <button
              onClick={() => setActiveTab('pharmacy')}
              className={`pb-2 px-1 ${activeTab === 'pharmacy' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Pharmacy Info
            </button>
          )}
        </nav>
      </div>
      <div>
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'users' && canManageUsers && <UserManagement />}
        {activeTab === 'pharmacy' && canEditPharmacy && <PharmacyInfoSettings />}
      </div>
    </div>
  )
}

export default Settings