import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Đăng ký các thành phần cần thiết
ChartJS.register(ArcElement, Tooltip, Legend);

const CompletionChart = ({
  completionPercentage,
  labelComplete = 'Hoàn thành',   // Mặc định là 'Hoàn thành'
  labelIncomplete = 'Chưa hoàn thành', // Mặc định là 'Chưa hoàn thành'
  completeColor = '#4CAF50',       // Màu mặc định cho phần hoàn thành
  incompleteColor = '#E0E0E0',     // Màu mặc định cho phần chưa hoàn thành
  className = ''                   // Thêm prop className để tuỳ chỉnh lớp Tailwind
}) => {
  const data = {
    labels: [labelComplete, labelIncomplete], // Tuỳ chỉnh labels
    datasets: [
      {
        data: [completionPercentage, 100 - completionPercentage],
        backgroundColor: [completeColor, incompleteColor], // Tuỳ chỉnh màu sắc
        hoverBackgroundColor: [completeColor, incompleteColor], // Tuỳ chỉnh màu khi hover
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom', // Vị trí của legend
        labels: {
          boxWidth: 10, // Điều chỉnh kích thước hình vuông bên cạnh mỗi label
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`, // Định dạng tooltip hiển thị %
        },
      },
    },
  };

  return (
    <div className={`relative ${className}`}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default CompletionChart;
