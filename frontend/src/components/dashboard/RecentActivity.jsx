import React, { useEffect, useState } from 'react';
import { getRecentActivity } from '../../services/dashboardService';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { Clock, DollarSign, Package, User, FileText, Truck } from 'lucide-react';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getRecentActivity();
        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const getActivityIcon = (action) => {
    if (!action) return <Clock size={16} className="text-gray-500" />;
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('sale') || lowerAction.includes('transaction')) return <DollarSign size={16} className="text-green-600" />;
    if (lowerAction.includes('prescription')) return <FileText size={16} className="text-blue-600" />;
    if (lowerAction.includes('stock') || lowerAction.includes('medicine')) return <Package size={16} className="text-purple-600" />;
    if (lowerAction.includes('user') || lowerAction.includes('login')) return <User size={16} className="text-indigo-600" />;
    if (lowerAction.includes('supplier')) return <Truck size={16} className="text-orange-600" />;
    return <Clock size={16} className="text-gray-500" />;
  };

  const getActivityColor = (action) => {
    if (!action) return 'bg-gray-50 border-gray-200';
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('sale')) return 'bg-green-50 border-green-200';
    if (lowerAction.includes('prescription')) return 'bg-blue-50 border-blue-200';
    if (lowerAction.includes('stock')) return 'bg-purple-50 border-purple-200';
    if (lowerAction.includes('user')) return 'bg-indigo-50 border-indigo-200';
    if (lowerAction.includes('supplier')) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
        <Clock size={20} className="text-gray-400" />
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="mx-auto mb-2" size={40} />
          <p>No recent activity</p>
          <p className="text-sm">Actions will appear here as you use the system</p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((act, idx) => (
            <li key={act._id || idx} className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(act.action)} transition hover:shadow-sm`}>
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(act.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {act.user?.username || 'System'}
                </p>
                <p className="text-sm text-gray-700 break-words">
                  {act.description || act.action || 'Activity'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : 'Recently'}
                </p>
              </div>
              {act.amount && (
                <div className="flex-shrink-0">
                  <span className="text-sm font-semibold text-green-600">
                    +${act.amount.toFixed(2)}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivity;