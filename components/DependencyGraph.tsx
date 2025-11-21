import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Task } from '../types';

interface DependencyGraphProps {
  tasks: Task[];
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    // Setup Data
    const nodes = tasks.map(t => ({ ...t }));
    const links: any[] = [];

    tasks.forEach(t => {
      if (t.dependencies) {
        t.dependencies.forEach(depId => {
          const target = tasks.find(x => x.id === depId);
          if (target) {
            links.push({ source: t.id, target: depId });
          }
        });
      }
    });

    // Dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Colors
    const colorMap: Record<string, string> = {
      'done': '#10b981', // emerald-500
      'in-progress': '#f59e0b', // amber-500
      'pending': '#64748b', // slate-500
      'cancelled': '#f43f5e', // rose-500
    };

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
        .attr("viewBox", [0, 0, width, height]);

    // Simulation
    const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(40));

    // Container for zoom
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    
    svg.call(zoom as any);

    // Arrow Marker
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) // Position at edge of circle
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#475569") // slate-600
      .attr("d", "M0,-5L10,0L0,5");

    // Links
    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#334155")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

    // Nodes Group
    const node = g.append("g")
        .selectAll(".node")
        .data(nodes)
        .join("g")
        .attr("class", "node")
        .call(drag(simulation) as any);

    // Node Circles
    node.append("circle")
        .attr("r", 20)
        .attr("fill", "#1e293b") // slate-800
        .attr("stroke", (d: any) => colorMap[d.status] || '#64748b')
        .attr("stroke-width", 3);

    // Icons/Text inside nodes
    node.append("text")
        .text((d: any) => d.id)
        .attr("x", 0)
        .attr("y", 1)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#f8fafc")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("font-family", "monospace");

    // Labels below nodes
    node.append("text")
        .text((d: any) => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title)
        .attr("x", 0)
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .attr("fill", "#cbd5e1")
        .attr("font-size", "10px")
        .attr("class", "select-none");

    simulation.on("tick", () => {
        link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        node
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function drag(sim: any) {
        function dragstarted(event: any) {
            if (!event.active) sim.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) sim.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return () => {
        simulation.stop();
    };
  }, [tasks]);

  return (
    <svg ref={svgRef} className="w-full h-full bg-slate-950 cursor-move" />
  );
};