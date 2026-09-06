import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const componentPath = path.resolve(process.cwd(), 'components', 'system-dashboard.tsx');
const source = await readFile(componentPath, 'utf8');
const start = source.indexOf('const GRID_X');
const end = source.indexOf('export function SystemDashboard');
if (start < 0 || end < 0 || end <= start) throw new Error('Operation simulation source section could not be found.');

const diagnostics = `
const base = buildRoutePlans(8, 1, []);
const closure2 = buildRoutePlans(8, 2, []);
const closure3 = buildRoutePlans(8, 3, []);
const critical9 = buildRoutePlans(9, 1, []);
const help = buildRoutePlans(8, 1, [{ requesterId: 17, targetId: base.find(plan => plan.person.id === 17).target.id }]);
const blocked3 = new Set(CLOSURES.slice(0, 3).map(keyOf));
const crossesClosedNode = closure3.some(plan => plan.path.slice(1, -1).some(point => blocked3.has(keyOf(point))));
const coveredTargets = new Set(critical9.map(plan => plan.target.id)).size;
const result = {
  secondClosureChanges: countPlanChanges(base, closure2),
  thirdClosureChanges: countPlanChanges(closure2, closure3),
  newCriticalTargetChanges: countPlanChanges(base, critical9),
  helpRequestChanges: countPlanChanges(base, help),
  coveredTargets,
  crossesClosedNode,
};
if (result.secondClosureChanges < 1 || result.thirdClosureChanges < 1) throw new Error('A closure did not alter any calculated route.');
if (result.newCriticalTargetChanges < 1 || result.coveredTargets !== 9) throw new Error('New critical target was not covered by a real assignment.');
if (result.helpRequestChanges < 1) throw new Error('Help request did not change a support assignment or route.');
if (result.crossesClosedNode) throw new Error('A calculated path crosses a closed node.');
console.log(JSON.stringify(result));
`;

const transpiled = ts.transpileModule(`${source.slice(start, end)}\n${diagnostics}`, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);
