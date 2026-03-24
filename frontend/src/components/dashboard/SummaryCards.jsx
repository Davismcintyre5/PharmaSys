import React from 'react'
import { formatCurrency } from '../../utils/currencyFormatter'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Pill, 
  FileText,
  Package
} from 'lucide-react'

const SummaryCards = ({ data }) => {
  if (!data) return null

  const cards = [
    { 
      title: 'Current Balance', 
      value: formatCurrency(data.currentBalance), 
      icon: Wallet,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      title: 'Revenue Today', 
      value: formatCurrency(data.revenueToday), 
      icon: TrendingUp,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      title: 'Expenses Today', 
      value: formatCurrency(data.expensesToday), 
      icon: TrendingDown,
      color: 'bg-red-500',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600'
    },
    { 
      title: 'Low Stock Items', 
      value: data.lowStockItems, 
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    { 
      title: 'Total Patients', 
      value: data.totalPatients, 
      icon: Users,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    { 
      title: 'Medicines', 
      value: data.medicines, 
      icon: Pill,
      color: 'bg-indigo-500',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    { 
      title: 'Pending Rx', 
      value: data.pendingRx, 
      icon: FileText,
      color: 'bg-pink-500',
      bgLight: 'bg-pink-50',
      textColor: 'text-pink-600'
    },
    { 
      title: 'Inventory Value', 
      value: formatCurrency(data.inventoryValue || 0), 
      icon: Package,
      color: 'bg-teal-500',
      bgLight: 'bg-teal-50',
      textColor: 'text-teal-600'
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div 
            key={idx} 
            className={`${card.bgLight} rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <Icon className={`${card.textColor}`} size={20} />
            </div>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}

export default SummaryCards