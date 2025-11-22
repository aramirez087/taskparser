import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Task } from '../types';

interface DependencyGraphProps {
  tasks: Task[];
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; task: Task | null }>({
    visible: false,
    x: 0,
    y: 0,
    task: null
  });

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
      'deferred': '#a855f7', // purple-500
    };

    // Calculate node radius based on subtask count
    const getNodeRadius = (task: any) => {
      const baseRadius = 20;
      const subtaskCount = task.subtasks?.length || 0;
      if (subtaskCount === 0) return baseRadius;
      return baseRadius + Math.min(subtaskCount * 2, 15); // Cap at +15px
    };

    // Check if task has high priority
    const isHighPriority = (task: any) => {
      return task.priority === 'high' || task.priority === 'critical';
    };

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Defs for filters and gradients
    const defs = svg.append("defs");

    // Glow filter for high priority tasks
    const filter = defs.append("filter")
      .attr("id", "glow");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Simulation with dynamic collision radius
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => getNodeRadius(d) + 10));

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
    defs.selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 35) // Adjusted for dynamic node sizes
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#475569") // slate-600
      .attr("d", "M0,-5L10,0L0,5");

    // Links with gradient strokes
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", 2.5)
      .attr("marker-end", "url(#arrow)");

    // Create gradient for links
    const lineGradient = defs.append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse");

    lineGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.6);

    lineGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#a855f7")
      .attr("stop-opacity", 0.8);

    // Animated particles on links
    const particles = g.append("g")
      .selectAll(".particle")
      .data(links)
      .join("circle")
      .attr("class", "particle")
      .attr("r", 3)
      .attr("fill", "#818cf8")
      .attr("opacity", 0.8)
      .style("filter", "drop-shadow(0 0 4px rgba(129, 140, 248, 0.8))");

    // Animate particles
    function animateParticles() {
      particles.each(function (d: any, i: number) {
        const particle = d3.select(this);
        const linkData = d;

        function moveParticle() {
          particle
            .attr("cx", linkData.source.x)
            .attr("cy", linkData.source.y)
            .transition()
            .duration(2000 + Math.random() * 1000)
            .ease(d3.easeLinear)
            .attr("cx", linkData.target.x)
            .attr("cy", linkData.target.y)
            .on("end", () => {
              setTimeout(moveParticle, Math.random() * 2000);
            });
        }

        setTimeout(moveParticle, i * 200);
      });
    }

    animateParticles();

    // Nodes Group
    const node = g.append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(drag(simulation) as any);

    // High priority glow background
    node.filter((d: any) => isHighPriority(d))
      .append("circle")
      .attr("r", (d: any) => getNodeRadius(d) + 5)
      .attr("fill", "none")
      .attr("stroke", (d: any) => d.priority === 'critical' ? '#ef4444' : '#f59e0b')
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5)
      .attr("filter", "url(#glow)");

    // Node Circles
    node.append("circle")
      .attr("r", (d: any) => getNodeRadius(d))
      .attr("fill", "#1e293b") // slate-800
      .attr("stroke", (d: any) => colorMap[d.status] || '#64748b')
      .attr("stroke-width", (d: any) => isHighPriority(d) ? 4 : 3);

    // Subtask count badge
    node.filter((d: any) => d.subtasks && d.subtasks.length > 0)
      .append("circle")
      .attr("cx", (d: any) => getNodeRadius(d) * 0.6)
      .attr("cy", (d: any) => -getNodeRadius(d) * 0.6)
      .attr("r", 8)
      .attr("fill", "#6366f1") // indigo-500
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    node.filter((d: any) => d.subtasks && d.subtasks.length > 0)
      .append("text")
      .text((d: any) => d.subtasks.length)
      .attr("x", (d: any) => getNodeRadius(d) * 0.6)
      .attr("y", (d: any) => -getNodeRadius(d) * 0.6)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#f8fafc")
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none");

    // Acceptance criteria badge (small checkmark)
    node.filter((d: any) => d.acceptanceCriteria)
      .append("text")
      .text("✓")
      .attr("x", (d: any) => -getNodeRadius(d) * 0.6)
      .attr("y", (d: any) => -getNodeRadius(d) * 0.6)
      .attr("text-anchor", "middle")
      .attr("fill", "#10b981") // emerald-500
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none");

    // Task ID inside nodes
    node.append("text")
      .text((d: any) => d.id)
      .attr("x", 0)
      .attr("y", 1)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#f8fafc")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .attr("pointer-events", "none");

    // Labels below nodes
    node.append("text")
      .text((d: any) => d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title)
      .attr("x", 0)
      .attr("y", (d: any) => getNodeRadius(d) + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", "10px")
      .attr("class", "select-none")
      .attr("pointer-events", "none");

    // Tooltip interaction
    node.on("mouseenter", function (event, d: any) {
      const [x, y] = d3.pointer(event, svgRef.current);
      setTooltip({
        visible: true,
        x: x + 20,
        y: y - 10,
        task: d
      });
      d3.select(this).select("circle").attr("stroke-width", (d: any) => isHighPriority(d) ? 6 : 5);
    })
      .on("mouseleave", function (event, d: any) {
        setTooltip({ visible: false, x: 0, y: 0, task: null });
        d3.select(this).select("circle").attr("stroke-width", (d: any) => isHighPriority(d) ? 4 : 3);
      });

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
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full bg-slate-950 cursor-move" />

      {/* Tooltip */}
      {tooltip.visible && tooltip.task && (
        <div
          className="absolute pointer-events-none z-50 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-slate-500">#{tooltip.task.id}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${tooltip.task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
              tooltip.task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                tooltip.task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
              }`}>
              {tooltip.task.priority}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-200 mb-1">{tooltip.task.title}</h4>
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">{tooltip.task.description}</p>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            {tooltip.task.subtasks && tooltip.task.subtasks.length > 0 && (
              <span>📋 {tooltip.task.subtasks.length} subtasks</span>
            )}
            {tooltip.task.acceptanceCriteria && (
              <span className="text-emerald-400">✓ Has criteria</span>
            )}
            {tooltip.task.dependencies && tooltip.task.dependencies.length > 0 && (
              <span>🔗 {tooltip.task.dependencies.length} deps</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};