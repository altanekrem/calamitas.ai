import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const componentPath = path.resolve(process.cwd(), 'components', 'system-dashboard.tsx');
const source = await readFile(componentPath, 'utf8');
const start = source.indexOf('const GRID_X');
const end = source.indexOf('export function SystemDashboard');
if (start < 0 || end < 0 || end <= start) throw new Error('Operation simulation source section could not be found.');

const diagnostics = `
const baseKeys = [...DEFAULT_CLOSED_NODE_KEYS];
const manualKey = keyOf(pointAt(3, 4));
const base = buildRoutePlans(8, baseKeys, []);
const manualClosure = buildRoutePlans(8, [...baseKeys, manualKey], []);
const reopened = buildRoutePlans(8, baseKeys, []);
const critical9 = buildRoutePlans(9, baseKeys, []);
const help = buildRoutePlans(8, baseKeys, [{ requesterId: 17, targetId: base.find(plan => plan.person.id === 17).target.id }]);
const blockedManual = new Set([...baseKeys, manualKey]);
const crossesClosedNode = manualClosure.some(plan => plan.path?.some(point => blockedManual.has(keyOf(point))));
const alternativeCrossesClosedNode = manualClosure.some(plan => plan.alternative?.some(point => blockedManual.has(keyOf(point))));
const coveredTargets = new Set(critical9.map(plan => plan.target.id)).size;
const usedKeys = new Set(base.flatMap(plan => [...(plan.path ?? []), ...(plan.alternative ?? [])].map(keyOf)));
const unusedPoint = ROAD_POINTS.find(point => !usedKeys.has(keyOf(point)) && !baseKeys.includes(keyOf(point)));
if (!unusedPoint) throw new Error('No unused road point was available for the zero-change test.');
const unusedClosure = buildRoutePlans(8, [...baseKeys, keyOf(unusedPoint)], []);
const barrierKeys = [...new Set([...baseKeys, ...GRID_X.map((_, col) => keyOf(pointAt(col, 3)))])];
const barrierPlans = buildRoutePlans(8, barrierKeys, []);
const firstReachable = base.find(plan => plan.path);
if (!firstReachable) throw new Error('Base plan has no reachable route.');
const startBlockedPlans = buildRoutePlans(8, [...new Set([...baseKeys, keyOf(firstReachable.start)])], []);
const targetPoint = nearestGridPoint(firstReachable.target.x, firstReachable.target.y);
const targetBlockedPlans = buildRoutePlans(8, [...new Set([...baseKeys, keyOf(targetPoint)])], []);
const result = {
  manualClosureChanges: countPlanChanges(base, manualClosure),
  reopenedMatchesBase: countPlanChanges(base, reopened) === 0,
  unusedClosureChanges: countPlanChanges(base, unusedClosure),
  newCriticalTargetChanges: countPlanChanges(base, critical9),
  helpRequestChanges: countPlanChanges(base, help),
  coveredTargets,
  crossesClosedNode,
  alternativeCrossesClosedNode,
  unreachableAfterBarrier: barrierPlans.filter(plan => !plan.path).length,
  startClosureBlocksRoute: !startBlockedPlans.find(plan => plan.person.id === firstReachable.person.id)?.path,
  targetClosureBlocksRoute: !targetBlockedPlans.find(plan => plan.person.id === firstReachable.person.id)?.path,
};
if (result.manualClosureChanges < 1) throw new Error('The manually selected closure did not alter any calculated route.');
if (!result.reopenedMatchesBase) throw new Error('Removing a manual closure did not restore the base routes.');
if (result.unusedClosureChanges !== 0) throw new Error('An unused road point unexpectedly changed a route.');
if (result.newCriticalTargetChanges < 1 || result.coveredTargets !== 9) throw new Error('New critical target was not covered by a real assignment.');
if (result.helpRequestChanges < 1) throw new Error('Help request did not change a support assignment or route.');
if (result.crossesClosedNode || result.alternativeCrossesClosedNode) throw new Error('A calculated path crosses a closed node.');
if (result.unreachableAfterBarrier < 1) throw new Error('A disconnected road network did not produce an unreachable route.');
if (!result.startClosureBlocksRoute || !result.targetClosureBlocksRoute) throw new Error('Closing a route endpoint did not block that route.');
console.log(JSON.stringify(result));
`;

const transpiled = ts.transpileModule(`${source.slice(start, end)}\n${diagnostics}`, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);
