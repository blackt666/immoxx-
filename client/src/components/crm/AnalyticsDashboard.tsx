import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  Calendar,
  Phone,
  Mail,
  Eye,
  Download,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  overview: {
    total_leads: number;
    active_leads: number;
    won_deals: number;
    lost_deals: number;
    conversion_rate: number;
    avg_deal_value: number;
    total_pipeline_value: number;
  };
  pipeline_stats: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  temperature_distribution: Array<{
    temperature: string;
    count: number;
  }>;
  lead_sources: Array<{
    source: string;
    count: number;
    conversion_rate: number;
  }>;
  monthly_trends: Array<{
    month: string;
    new_leads: number;
    won_deals: number;
    revenue: number;
  }>;
  activities_summary: {
    total_activities: number;
    calls: number;
    emails: number;
    meetings: number;
    viewings: number;
  };
}

const COLORS = {
  primary: '#566B73',
  secondary: '#6585BC',
  accent: '#D9CDBF',
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
};

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<{ success: boolean; data: AnalyticsData }>({
    queryKey: ['crm-analytics', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/crm/v2/analytics?period=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  const analyticsData = analytics?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Keine Analytics-Daten verfügbar</p>
      </div>
    );
  }

  // Calculate trend indicators
  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600', percentage: ((current - previous) / previous * 100).toFixed(1) };
    } else if (current < previous) {
      return { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-600', percentage: ((previous - current) / previous * 100).toFixed(1) };
    }
    return { icon: null, color: 'text-gray-600', percentage: '0' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--bodensee-deep)' }}>
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Übersicht über Ihre CRM-Kennzahlen</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
            <option value="1y">Letztes Jahr</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamt Leads</p>
              <p className="text-3xl font-bold mt-2">{analyticsData.overview.total_leads}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}>
              <Users className="w-6 h-6" style={{ color: COLORS.primary }} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">↑ {analyticsData.overview.active_leads} aktiv</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold mt-2">{analyticsData.overview.conversion_rate.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.success + '20' }}>
              <Target className="w-6 h-6" style={{ color: COLORS.success }} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">{analyticsData.overview.won_deals} gewonnen</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pipeline Value</p>
              <p className="text-3xl font-bold mt-2">
                €{(analyticsData.overview.total_pipeline_value / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.secondary + '20' }}>
              <DollarSign className="w-6 h-6" style={{ color: COLORS.secondary }} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Ø €{(analyticsData.overview.avg_deal_value / 1000).toFixed(0)}k pro Deal</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktivitäten</p>
              <p className="text-3xl font-bold mt-2">{analyticsData.activities_summary.total_activities}</p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.accent + '60' }}>
              <Activity className="w-6 h-6" style={{ color: COLORS.primary }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4" />
            <span>{analyticsData.activities_summary.calls}</span>
            <Mail className="w-4 h-4 ml-2" />
            <span>{analyticsData.activities_summary.emails}</span>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--bodensee-deep)' }}>
            Pipeline-Verteilung
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.pipeline_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Temperature Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--bodensee-deep)' }}>
            Lead-Temperatur
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.temperature_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.temperature}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.temperature_distribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.temperature === 'hot'
                        ? COLORS.hot
                        : entry.temperature === 'warm'
                        ? COLORS.warm
                        : COLORS.cold
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--bodensee-deep)' }}>
            Lead-Quellen
          </h3>
          <div className="space-y-3">
            {analyticsData.lead_sources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{source.source}</span>
                    <span className="text-sm text-gray-600">{source.count} Leads</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${source.conversion_rate}%`,
                        backgroundColor: COLORS.secondary,
                      }}
                    />
                  </div>
                </div>
                <Badge className="ml-4" variant="outline">
                  {source.conversion_rate}% Conv.
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--bodensee-deep)' }}>
            Monatliche Trends
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData.monthly_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="new_leads" stroke={COLORS.primary} name="Neue Leads" />
              <Line type="monotone" dataKey="won_deals" stroke={COLORS.success} name="Gewonnen" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--bodensee-deep)' }}>
          Aktivitäts-Übersicht
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Phone className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.primary }} />
            <p className="text-2xl font-bold">{analyticsData.activities_summary.calls}</p>
            <p className="text-sm text-gray-600">Anrufe</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Mail className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.secondary }} />
            <p className="text-2xl font-bold">{analyticsData.activities_summary.emails}</p>
            <p className="text-sm text-gray-600">E-Mails</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.primary }} />
            <p className="text-2xl font-bold">{analyticsData.activities_summary.meetings}</p>
            <p className="text-sm text-gray-600">Meetings</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Eye className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.secondary }} />
            <p className="text-2xl font-bold">{analyticsData.activities_summary.viewings}</p>
            <p className="text-sm text-gray-600">Besichtigungen</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
