import { BROWSER_MAKERS } from '@svgdiagram/diagram/web';
import { LABELS, OPTIONS } from './field-metadata.js';
import * as venn from '~/lib/tools/venn.js';
import * as punnett from '~/lib/tools/punnett.js';
import * as tChart from '~/lib/tools/tChart.js';
import * as numberLine from '~/lib/tools/numberLine.js';
import * as coordinatePlane from '~/lib/tools/coordinatePlane.js';
import * as scatterPlot from '~/lib/tools/scatterPlot.js';
import * as dotPlot from '~/lib/tools/dotPlot.js';
import * as histogram from '~/lib/tools/histogram.js';
import * as pieChart from '~/lib/tools/pieChart.js';
import * as lineGraph from '~/lib/tools/lineGraph.js';
import VennDiagram from '~/components/features/tools/VennDiagram.vue';
import PunnettDiagram from '~/components/features/tools/PunnettDiagram.vue';
import TChartDiagram from '~/components/features/tools/TChartDiagram.vue';
import NumberLineDiagram from '~/components/features/tools/NumberLineDiagram.vue';
import CoordinatePlaneDiagram from '~/components/features/tools/CoordinatePlaneDiagram.vue';
import ScatterPlotDiagram from '~/components/features/tools/ScatterPlotDiagram.vue';
import DotPlotDiagram from '~/components/features/tools/DotPlotDiagram.vue';
import HistogramDiagram from '~/components/features/tools/HistogramDiagram.vue';
import PieChartDiagram from '~/components/features/tools/PieChartDiagram.vue';
import LineGraphDiagram from '~/components/features/tools/LineGraphDiagram.vue';

export const MAKERS = [
  { id: 'venn-diagram', initial: venn.DEFAULT_VENN, normalize: venn.normalizeVenn, layout: venn.layoutVenn, component: VennDiagram, examples: venn.VENN_EXAMPLES.map(e => ({ label: e.title, state: e.venn })) },
  { id: 'punnett-square', initial: punnett.DEFAULT_PUNNETT, normalize: punnett.normalizePunnett, layout: punnett.layoutPunnett, component: PunnettDiagram, examples: punnett.PUNNETT_EXAMPLES.map(e => ({ label: e.title, state: e.punnett })) },
  { id: 't-chart', initial: tChart.DEFAULT_T_CHART, normalize: tChart.normalizeTChart, layout: tChart.layoutTChart, component: TChartDiagram, examples: tChart.T_CHART_EXAMPLES.map(e => ({ label: e.title, state: e.chart })) },
  { id: 'number-line', initial: numberLine.DEFAULT_NUMBER_LINE, normalize: numberLine.normalizeNumberLine, layout: numberLine.layoutNumberLine, component: NumberLineDiagram, examples: numberLine.NUMBER_LINE_EXAMPLES.map(e => ({ label: e.title, state: e.line })) },
  { id: 'coordinate-plane', initial: coordinatePlane.DEFAULT_COORDINATE_PLANE, normalize: coordinatePlane.normalizeCoordinatePlane, layout: coordinatePlane.layoutCoordinatePlane, component: CoordinatePlaneDiagram, examples: coordinatePlane.COORDINATE_PLANE_EXAMPLES.map(e => ({ label: e.title, state: e.plane })) },
  { id: 'scatter-plot', initial: scatterPlot.DEFAULT_SCATTER_PLOT, normalize: scatterPlot.normalizeScatterPlot, layout: scatterPlot.layoutScatterPlot, component: ScatterPlotDiagram, examples: scatterPlot.SCATTER_PLOT_EXAMPLES.map(e => ({ label: e.title, state: e.scatter })) },
  { id: 'dot-plot', initial: dotPlot.DEFAULT_DOT_PLOT, normalize: dotPlot.normalizeDotPlot, layout: dotPlot.layoutDotPlot, component: DotPlotDiagram, examples: dotPlot.DOT_PLOT_EXAMPLES.map(e => ({ label: e.title, state: e.plot })) },
  { id: 'histogram', initial: histogram.DEFAULT_HISTOGRAM, normalize: histogram.normalizeHistogram, layout: histogram.layoutHistogram, component: HistogramDiagram, examples: histogram.HISTOGRAM_EXAMPLES.map(e => ({ label: e.title, state: e.histogram })) },
  { id: 'pie-chart', initial: pieChart.DEFAULT_PIE_CHART, normalize: pieChart.normalizePieChart, layout: pieChart.layoutPieChart, component: PieChartDiagram, examples: pieChart.PIE_CHART_EXAMPLES.map(e => ({ label: e.title, state: e.pieChart })) },
  { id: 'line-graph', initial: lineGraph.DEFAULT_LINE_GRAPH, normalize: lineGraph.normalizeLineGraph, layout: lineGraph.layoutLineGraph, component: LineGraphDiagram, examples: lineGraph.LINE_GRAPH_EXAMPLES.map(e => ({ label: e.title, state: e.lineGraph })) },
].map(maker => {
  const descriptor = BROWSER_MAKERS.find(item => item.id === maker.id);
  if (!descriptor) throw new Error(`Unknown manual maker: ${maker.id}`);
  return { ...descriptor, ...maker };
});
if (MAKERS.length !== BROWSER_MAKERS.length) throw new Error('Manual maker catalog and renderers must match');

export function makerFields(state, parent = '', setCount = 3) {
  return Object.entries(state).filter(([key]) => {
    if (parent === 'regions' && ![...venn.VENN_REGIONS[setCount], venn.VENN_OUTSIDE].includes(key)) return false;
    if (key === 'lists' && state.source !== 'lists') return false;
    if (key === 'regions' && state.source !== 'regions') return false;
    if (key === 'traitB' && state.geneCount !== 2) return false;
    return true;
  }).map(([key, value]) => {
    const multiline = ['data', 'dataText', 'lists'].includes(key) || parent === 'regions';
    let maxLength = parent === 'regions' ? venn.VENN_LIMITS.region : multiline ? 20000 : 140;
    if (key === 'title') maxLength = 80;
    if (['names', 'leftHeading', 'rightHeading', 'name'].includes(key)) maxLength = 40;
    const item = key === 'rows' ? { left: '', right: '' } : key === 'points' ? (state.xMin !== undefined ? { x: '0', y: '0', label: '' } : { value: '0', label: '' }) : key === 'intervals' ? { from: '0', to: '1', startClosed: true, endClosed: true } : '';
    return { key, label: LABELS[key] || key, value, options: key === 'shaded' ? [...venn.VENN_REGIONS[state.count], venn.VENN_OUTSIDE] : OPTIONS[key], multiline, maxLength, item, optionLabels: LABELS,
      fixed: ['colors', 'names', 'lists'].includes(key), maximum: key === 'rows' ? tChart.T_CHART_LIMITS.maxRows : key === 'intervals' ? numberLine.NUMBER_LINE_LIMITS.maxIntervals : key === 'points' ? (state.xMin !== undefined ? coordinatePlane.COORDINATE_PLANE_LIMITS.maxPoints : numberLine.NUMBER_LINE_LIMITS.maxPoints) : 0,
      minimum: key === 'rows' ? 1 : 0, count: ['names', 'lists'].includes(key) ? state.count : undefined };
  });
}
