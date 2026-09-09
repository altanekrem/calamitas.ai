export type OsmSource = 'region' | 'cache' | 'network';

export interface JurySimulationStep2 {
  before_image_source: string;
  osm_source: OsmSource;
  solution_time_ms: number;
  offline_ready: boolean;
  summary: string;
  post_image_source?: string;
  matched_by?: string;
}

export interface JuryPlanReference {
  plan_id: string;
  plan_hash: string;
  signature: string;
  version: string;
}

export interface JuryReroutedTeam {
  team_name: string;
  old_order: number[];
  new_order: number[];
  unreachable_buildings: number[];
  old_expected_savable: number;
  new_expected_savable: number;
}

export interface JurySimulationStep7 {
  replan_summary: string;
  rerouted_teams: JuryReroutedTeam[];
  unreachable_buildings: number[];
  plan_id: string;
  plan_hash: string;
  signature: string;
  replan_plan_id: string;
  replan_plan_hash: string;
  replan_signature: string;
  old_plan: JuryPlanReference;
  new_plan: JuryPlanReference;
  replan_version: string;
  roadblock_coords: [number, number, number];
}

export interface JurySimulationResult {
  simulation_schema_version: string;
  incident_id: string;
  region_id: string;
  step_2: JurySimulationStep2;
  step_7: JurySimulationStep7;
}
