import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData } from '../types';

interface Props {
  graph: GraphData;
}

export const RelationshipGraph: React.FC<Props> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 300;

    const nodes = graph.nodes.map(n => ({ ...n }));
    const links = graph.links.map(l => ({ ...l }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#52525b') // zinc-600
      .style('opacity', 0.5);

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#3f3f46') // zinc-700
      .attr('stroke-width', (d: any) => Math.max(1, (d.strength || 1) * 3))
      .attr('marker-end', 'url(#arrowhead)');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('rect')
      .attr('width', 140)
      .attr('height', 44)
      .attr('x', -70)
      .attr('y', -22)
      .attr('rx', 8)
      .attr('fill', '#18181b') // zinc-900
      .attr('stroke', (d: any) => d.status === 'risk' ? '#f43f5e' : '#10b981')
      .attr('stroke-width', 1);

    node.append('text')
      .text((d: any) => d.label || d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '-2px')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#f4f4f5'); // zinc-100

    node.append('text')
      .text((d: any) => `Score: ${d.impact_score || 0}`)
      .attr('text-anchor', 'middle')
      .attr('dy', '12px')
      .attr('font-size', '10px')
      .attr('fill', '#a1a1aa'); // zinc-400

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [graph]);

  return (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/80">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400 mb-4">Strategic Dependency Network</div>
      <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 overflow-hidden cursor-move">
        <svg ref={svgRef} width="100%" height="300" viewBox="0 0 600 300" />
      </div>
    </div>
  );
};
