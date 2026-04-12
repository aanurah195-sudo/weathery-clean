import React from 'react';

export default function Sidebar() {
  return (
    <aside className="sidebar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      flexDirection: 'column'
    }}>
      
      <div className="sidebar-logo" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        <span style={{ fontSize: '20px' }}>🌦</span>
        Weathry
      </div>

    </aside>
  );
}