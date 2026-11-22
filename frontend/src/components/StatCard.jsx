import React from 'react';

const colorStyles = {
  blue: {
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.25)',
    iconColor: '#60a5fa'
  },
  purple: {
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
    iconColor: '#a78bfa'
  },
  green: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    iconColor: '#34d399'
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    iconColor: '#fbbf24'
  }
};

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const scheme = colorStyles[color] || colorStyles.blue;

  return (
    <div className="stat-card">
      <div
        className="stat-icon-wrapper"
        style={{
          background: scheme.bg,
          border: `1px solid ${scheme.border}`,
          color: scheme.iconColor
        }}
      >
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
