import React from 'react';
import { formatCurrency } from '../../utils/currency';

const RecentOrders = ({ orders = [] }) => {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Recent Orders</h3>
      {orders.length === 0 ? (
        <p>No recent orders</p>
      ) : (
        <ul>
          {orders.map(order => (
            <li key={order._id}>
              {order.patientId?.name || 'Unknown'} - {formatCurrency(order.total)} - {new Date(order.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentOrders;