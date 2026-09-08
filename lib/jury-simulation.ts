export type JuryBuilding = {
  id: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  damage_level: string;
  confidence: number;
  priority: string;
  score: number;
  team_count: number;
};

export type JurySimulationResult = {
  analysis: {
    buildings: JuryBuilding[];
  };
  step2: {
    osm_source: 'region' | 'cache' | 'network';
    solution_time: number;
    route: unknown;
  };
  step7: {
    replan_summary: string;
    rerouted_teams: unknown[];
    old_plan: {
      plan_id: string;
      plan_hash?: string;
      signature?: string;
    };
    new_plan: {
      plan_id: string;
      plan_hash?: string;
      signature?: string;
    };
    unreachable: unknown[];
  };
};

export function isJurySimulationResult(value: unknown): value is JurySimulationResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<JurySimulationResult>;
  return Boolean(
    result.analysis && Array.isArray(result.analysis.buildings)
      && result.step2 && typeof result.step2.solution_time === 'number'
      && ['region', 'cache', 'network'].includes(result.step2.osm_source ?? '')
      && result.step7 && typeof result.step7.replan_summary === 'string'
      && result.step7.old_plan && typeof result.step7.old_plan.plan_id === 'string'
      && result.step7.new_plan && typeof result.step7.new_plan.plan_id === 'string'
      && Array.isArray(result.step7.rerouted_teams)
      && Array.isArray(result.step7.unreachable),
  );
}

export function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}
