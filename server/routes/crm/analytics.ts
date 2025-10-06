import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { crmLeads, crmActivities } from '../../database/schema/crm';
import { eq, and, sql, gte, lte, desc, count } from 'drizzle-orm';
import { log } from '../../lib/logger.js';

const router = Router();

/**
 * GET /api/crm/analytics - Get CRM analytics and metrics
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all leads
    const allLeads = await db.select().from(crmLeads);

    // Get leads in date range
    const recentLeads = allLeads.filter(
      (lead) => lead.created_at && new Date(lead.created_at) >= startDate
    );

    // Overview stats
    const overview = {
      total_leads: allLeads.length,
      active_leads: allLeads.filter((l) => l.status === 'active' || l.status === 'new').length,
      won_deals: allLeads.filter((l) => l.pipeline_stage === 'won').length,
      lost_deals: allLeads.filter((l) => l.pipeline_stage === 'lost').length,
      conversion_rate:
        allLeads.length > 0
          ? (allLeads.filter((l) => l.pipeline_stage === 'won').length / allLeads.length) * 100
          : 0,
      avg_deal_value: calculateAvgDealValue(allLeads),
      total_pipeline_value: calculateTotalPipelineValue(allLeads),
    };

    // Pipeline stats
    const pipelineStages = [
      'inbox',
      'contacted',
      'qualified',
      'viewing_scheduled',
      'offer_made',
      'negotiation',
      'won',
      'lost',
    ];

    const pipeline_stats = pipelineStages.map((stage) => {
      const stageLeads = allLeads.filter((l) => l.pipeline_stage === stage);
      return {
        stage: getStageLabel(stage),
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0),
      };
    });

    // Temperature distribution
    const temperature_distribution = [
      { temperature: 'hot', count: allLeads.filter((l) => l.temperature === 'hot').length },
      { temperature: 'warm', count: allLeads.filter((l) => l.temperature === 'warm').length },
      { temperature: 'cold', count: allLeads.filter((l) => l.temperature === 'cold').length },
    ];

    // Lead sources
    const sourceMap = new Map<string, { count: number; won: number }>();
    allLeads.forEach((lead) => {
      const source = lead.source || 'unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { count: 0, won: 0 });
      }
      const stats = sourceMap.get(source)!;
      stats.count++;
      if (lead.pipeline_stage === 'won') {
        stats.won++;
      }
    });

    const lead_sources = Array.from(sourceMap.entries()).map(([source, stats]) => ({
      source: getSourceLabel(source),
      count: stats.count,
      conversion_rate: stats.count > 0 ? (stats.won / stats.count) * 100 : 0,
    }));

    // Monthly trends (last 6 months)
    const monthly_trends = generateMonthlyTrends(allLeads, 6);

    // Activities summary
    const activities = await db.select().from(crmActivities);

    const recentActivities = activities.filter(
      (activity) => activity.created_at && new Date(activity.created_at) >= startDate
    );

    const activities_summary = {
      total_activities: recentActivities.length,
      calls: recentActivities.filter((a) => a.activity_type === 'call').length,
      emails: recentActivities.filter((a) => a.activity_type === 'email').length,
      meetings: recentActivities.filter((a) => a.activity_type === 'meeting').length,
      viewings: recentActivities.filter(
        (a) => a.activity_type === 'property_view' || a.activity_type === 'viewing_scheduled'
      ).length,
    };

    res.json({
      success: true,
      data: {
        overview,
        pipeline_stats,
        temperature_distribution,
        lead_sources,
        monthly_trends,
        activities_summary,
      },
    });
  } catch (error) {
    log.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    });
  }
});

// Helper functions
function calculateAvgDealValue(leads: any[]): number {
  const wonLeads = leads.filter((l) => l.pipeline_stage === 'won' && l.budget_max);
  if (wonLeads.length === 0) return 0;
  const total = wonLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
  return total / wonLeads.length;
}

function calculateTotalPipelineValue(leads: any[]): number {
  const activeLeads = leads.filter(
    (l) => l.pipeline_stage !== 'won' && l.pipeline_stage !== 'lost'
  );
  return activeLeads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    inbox: 'Posteingang',
    contacted: 'Kontaktiert',
    qualified: 'Qualifiziert',
    viewing_scheduled: 'Besichtigung',
    offer_made: 'Angebot',
    negotiation: 'Verhandlung',
    won: 'Gewonnen',
    lost: 'Verloren',
  };
  return labels[stage] || stage;
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    website: 'Website',
    manual: 'Manuell',
    referral: 'Empfehlung',
    csv_import: 'CSV Import',
    facebook: 'Facebook',
    google: 'Google',
    instagram: 'Instagram',
    unknown: 'Unbekannt',
  };
  return labels[source] || source;
}

function generateMonthlyTrends(leads: any[], months: number): any[] {
  const trends = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const monthLeads = leads.filter((lead) => {
      const createdAt = new Date(lead.created_at);
      return createdAt >= monthStart && createdAt <= monthEnd;
    });

    const wonDeals = monthLeads.filter((l) => l.pipeline_stage === 'won');

    trends.push({
      month: monthDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      new_leads: monthLeads.length,
      won_deals: wonDeals.length,
      revenue: wonDeals.reduce((sum, l) => sum + (l.budget_max || 0), 0),
    });
  }

  return trends;
}

export default router;
