import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getPharmacySettings } from '../../services/settingsService';

const Header = () => {
  const [time, setTime] = useState(new Date());
  const [pharmacyName, setPharmacyName] = useState('Pharmacy');
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getPharmacySettings();
        setPharmacyName(settings.name);
      } catch (err) {
        console.error('Failed to fetch pharmacy settings', err);
      }
    };
    fetchSettings();
  }, []);

  const formattedTime = time.toLocaleTimeString();
  const formattedDate = time.toLocaleDateString();

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center print:hidden">
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          PharmaSys <span className="text-sm font-normal text-gray-600">| {pharmacyName}</span>
        </h1>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">{formattedDate}</p>
        <p className="text-lg font-mono">{formattedTime}</p>
      </div>
    </header>
  );
};

export default Header;