import React, { useState, useEffect } from 'react'
import { getPrescriptions, updatePrescriptionStatus } from '../services/prescriptionService'
import { formatCurrency } from '../utils/currencyFormatter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PrescriptionDetails from '../components/prescriptions/PrescriptionDetails'

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const data = await getPrescriptions()
        setPrescriptions(data)
      } catch (err) {
        setError('Failed to load prescriptions')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrescriptions()
  }, [])

  const handleStatusChange = async (id, status) => {
    try {
      await updatePrescriptionStatus(id, status)
      setPrescriptions(prescriptions.map(rx =>
        rx._id === id ? { ...rx, status } : rx
      ))
    } catch (err) {
      alert('Failed to update prescription status')
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      fulfilled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
        {status}
      </span>
    )
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500 p-8">{error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Prescriptions</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescribed By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prescriptions.map((rx) => (
              <tr key={rx._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}` : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{rx.prescribedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(rx.datePrescribed).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(rx.totalAmount)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(rx.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => setSelectedPrescription(rx)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  {rx.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(rx._id, 'fulfilled')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Fulfill
                      </button>
                      <button
                        onClick={() => handleStatusChange(rx._id, 'cancelled')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPrescription && (
        <PrescriptionDetails
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

export default Prescriptions