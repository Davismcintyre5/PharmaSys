import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS } from 'chart.js';
import '../../utils/chartConfig'; // registers all components

const Chart = ({ data, options }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Destroy previous chart instance to avoid canvas reuse error
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = canvasRef.current.getContext('2d');
      chartInstance.current = new ChartJS(ctx, {
        type: 'line',
        data: data,
        options: options,
      });
    }
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, options]);

  return <canvas ref={canvasRef} />;
};

export default Chart;