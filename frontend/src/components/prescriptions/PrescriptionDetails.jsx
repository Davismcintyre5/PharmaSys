import React, { useEffect, useState } from 'react'
import { getPrescriptionById } from '../../services/prescriptionService'
import { formatCurrency } from '../../utils/currencyFormatter'

const PrescriptionDetails = ({ prescription, onClose, onStatusChange }) => {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getPrescriptionById(prescription._id)
        setDetails(data)
      } catch (error) {
        console.error('Failed to fetch prescription details:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [prescription])

  if (loading) return <div>Loading...</div>
  if (!details) return null

  const { prescription: rx, items } = details

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Prescription Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Patient</p>
              <p className="font-medium">{rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}` : 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prescribed By</p>
              <p className="font-medium">{rx.prescribedBy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date(rx.datePrescribed).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">{rx.status}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Medicines</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Medicine</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-2">{item.medicine?.name || 'Unknown'}</td>
                    <td className="px-4 py-2">{item.quantity}</td>
                    <td className="px-4 py-2">{formatCurrency(item.medicine?.unitPrice || 0)}</td>
                    <td className="px-4 py-2">{formatCurrency((item.medicine?.unitPrice || 0) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right mt-4 font-bold">
              Total: {formatCurrency(rx.totalAmount)}
            </div>
          </div>
          {rx.status === 'pending' && (
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  onStatusChange(rx._id, 'fulfilled')
                  onClose()
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Mark as Fulfilled
              </button>
              <button
                onClick={() => {
                  onStatusChange(rx._id, 'cancelled')
                  onClose()
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrescriptionDetails