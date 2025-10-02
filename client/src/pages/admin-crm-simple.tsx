import React, { useState, useEffect } from 'react';

// Simple CRM Dashboard - No authentication required for development
export default function AdminCRMSimple() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?temperature=${filter}` : '';
      const response = await fetch(`/api/crm/v2/leads${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setLeads(data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // Group leads by stage
  const stages = [
    { id: 'inbox', label: 'Neu', color: '#e5e7eb', icon: '📥' },
    { id: 'contacted', label: 'Kontaktiert', color: '#dbeafe', icon: '📞' },
    { id: 'qualified', label: 'Qualifiziert', color: '#d1fae5', icon: '✓' },
    { id: 'viewing_scheduled', label: 'Besichtigung', color: '#e9d5ff', icon: '🏠' },
    { id: 'offer_made', label: 'Angebot', color: '#fed7aa', icon: '💰' },
    { id: 'negotiation', label: 'Verhandlung', color: '#fef3c7', icon: '🤝' },
    { id: 'won', label: 'Gewonnen', color: '#86efac', icon: '🎉' },
    { id: 'lost', label: 'Verloren', color: '#fecaca', icon: '❌' },
  ];

  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.pipeline_stage === stage.id);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.temperature === 'hot').length,
    warm: leads.filter(l => l.temperature === 'warm').length,
    cold: leads.filter(l => l.temperature === 'cold').length,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Lade CRM Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#dc2626' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Fehler beim Laden</h3>
          </div>
          <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
            {error}
          </p>
          <button
            onClick={fetchLeads}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .lead-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s;
        }
        .lead-card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .temp-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .temp-hot { background: #ef4444; color: white; }
        .temp-warm { background: #f97316; color: white; }
        .temp-cold { background: #3b82f6; color: white; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', margin: '0 0 8px 0' }}>CRM Dashboard</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Lead Management & Pipeline Übersicht</p>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Gesamt Leads</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{stats.total}</p>
            </div>
            <span style={{ fontSize: '32px' }}>👥</span>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Hot Leads</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>{stats.hot}</p>
            </div>
            <span style={{ fontSize: '32px' }}>🔥</span>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Warm Leads</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#f97316' }}>{stats.warm}</p>
            </div>
            <span style={{ fontSize: '32px' }}>☀️</span>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Cold Leads</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#3b82f6' }}>{stats.cold}</p>
            </div>
            <span style={{ fontSize: '32px' }}>❄️</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            border: filter === 'all' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            background: filter === 'all' ? '#3b82f6' : 'white',
            color: filter === 'all' ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filter === 'all' ? '600' : '400',
          }}
        >
          Alle ({stats.total})
        </button>
        <button
          onClick={() => setFilter('hot')}
          style={{
            padding: '8px 16px',
            border: filter === 'hot' ? '2px solid #ef4444' : '1px solid #e5e7eb',
            background: filter === 'hot' ? '#ef4444' : 'white',
            color: filter === 'hot' ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filter === 'hot' ? '600' : '400',
          }}
        >
          🔥 Hot ({stats.hot})
        </button>
        <button
          onClick={() => setFilter('warm')}
          style={{
            padding: '8px 16px',
            border: filter === 'warm' ? '2px solid #f97316' : '1px solid #e5e7eb',
            background: filter === 'warm' ? '#f97316' : 'white',
            color: filter === 'warm' ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filter === 'warm' ? '600' : '400',
          }}
        >
          ☀️ Warm ({stats.warm})
        </button>
        <button
          onClick={() => setFilter('cold')}
          style={{
            padding: '8px 16px',
            border: filter === 'cold' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            background: filter === 'cold' ? '#3b82f6' : 'white',
            color: filter === 'cold' ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filter === 'cold' ? '600' : '400',
          }}
        >
          ❄️ Cold ({stats.cold})
        </button>
      </div>

      {/* Kanban Board */}
      <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', minWidth: 'max-content' }}>
          {stages.map(stage => (
            <div key={stage.id} style={{ minWidth: '300px', maxWidth: '300px' }}>
              <div style={{ background: stage.color, padding: '12px', borderRadius: '8px 8px 0 0', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{stage.icon}</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{stage.label}</h3>
                  </div>
                  <span style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
                    {leadsByStage[stage.id]?.length || 0}
                  </span>
                </div>
              </div>

              <div style={{ background: 'white', padding: '12px', borderRadius: '0 0 8px 8px', minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
                {leadsByStage[stage.id]?.length > 0 ? (
                  leadsByStage[stage.id].map((lead: any) => (
                    <div key={lead.id} className="lead-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                            {lead.first_name} {lead.last_name}
                          </h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{lead.email}</p>
                        </div>
                        <span className={`temp-badge temp-${lead.temperature}`}>
                          {lead.temperature === 'hot' && '🔥'}
                          {lead.temperature === 'warm' && '☀️'}
                          {lead.temperature === 'cold' && '❄️'}
                        </span>
                      </div>

                      {lead.phone && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          📞 <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{lead.phone}</a>
                        </div>
                      )}

                      {lead.property_type && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          🏠 {lead.property_type}
                        </div>
                      )}

                      {lead.budget_min && lead.budget_max && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          💰 {lead.budget_min.toLocaleString()}€ - {lead.budget_max.toLocaleString()}€
                        </div>
                      )}

                      {lead.preferred_location && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          📍 {lead.preferred_location}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#8b5cf6' }}>
                          Score: {lead.score}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <a href={`tel:${lead.phone}`} style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '14px', textDecoration: 'none' }}>📞</a>
                          <a href={`mailto:${lead.email}`} style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '14px', textDecoration: 'none' }}>✉️</a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>Keine Leads</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
