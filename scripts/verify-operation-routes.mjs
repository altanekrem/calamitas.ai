import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const component = await readFile(path.join(root, 'components', 'system-dashboard.tsx'), 'utf8');
const contract = await readFile(path.join(root, 'lib', 'jury-simulation.ts'), 'utf8');
const api = await readFile(path.join(root, 'app', 'api', 'analyze', 'route.ts'), 'utf8');

for (const token of ['buildRoutePlans', 'findPath', 'assignmentScore', 'Math.random', 'checksum', '92.4']) {
  if (component.includes(token)) throw new Error(`Frontend contains forbidden synthetic logic: ${token}`);
}
for (const token of ['analysis', 'step2', 'step7', 'rerouted_teams', 'unreachable', 'plan_hash', 'signature']) {
  if (!contract.includes(token)) throw new Error(`Contract is missing required field: ${token}`);
}
if (!api.includes('BACKEND_ANALYZE_URL') || !api.includes('isJurySimulationResult')) throw new Error('Analyze route is not connected to the validated backend contract.');
if (!component.includes("fetch('/api/analyze'")) throw new Error('Frontend does not call the analyze endpoint.');
console.log(JSON.stringify({ status: 'ok', checked: ['no synthetic route logic', 'JurySimulationResult fields', 'backend proxy', 'frontend API call'] }));
