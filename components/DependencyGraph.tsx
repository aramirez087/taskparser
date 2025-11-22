import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Task, Subtask } from '../types';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DependencyGraphProps {
  tasks: Task[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string | number;
  type: 'task' | 'subtask';
  data: Task | Subtask;
  parentId?: string | number;
  radius: number;
  status: string;
  priority?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | number | GraphNode;
  target: string | number | GraphNode;
  type: 'dependency' | 'hierarchy';
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Helper to determine node color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#10b981'; // emerald-500
      case 'in-progress': return '#f59e0b'; // amber-500
      case 'pending': return '#64748b'; // slate-500
      case 'cancelled': return '#f43f5e'; // rose-500
      case 'deferred': return '#a855f7'; // purple-500
      default: return '#64748b';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || tasks.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Flatten data into nodes and links
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    tasks.forEach(task => {
      // Add Main Task Node
      nodes.push({
        id: task.id,
        type: 'task',
        data: task,
        radius: 25 + (task.subtasks?.length || 0) * 2, // Size based on complexity
        status: task.status,
        priority: task.priority
      });

      // Add Subtask Nodes and Hierarchy Links
      if (task.subtasks) {
        task.subtasks.forEach(subtask => {
          const subtaskId = `${task.id}-${subtask.id}`;
          nodes.push({
            id: subtaskId,
            type: 'subtask',
            data: subtask,
            parentId: task.id,
            radius: 12,
            status: subtask.status,
            priority: subtask.priority
          });

          links.push({
            source: task.id,
            target: subtaskId,
            type: 'hierarchy'
          });
        });
      }

      // Add Dependency Links
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          // Ensure dependency exists in current filtered set
          if (tasks.find(t => t.id === depId)) {
            links.push({
              source: task.id,
              target: depId,
              type: 'dependency'
            });
          }
        });
      }
    });

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Setup Zoom
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Define Gradients and Filters
    const defs = svg.append("defs");

    // Glow Filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Link Gradients
    const linkGradient = defs.append("linearGradient")
      .attr("id", "link-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1").attr("stop-opacity", 0.4);
    linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "#a855f7").attr("stop-opacity", 0.6);

    // Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id.toString())
        .distance(d => d.type === 'hierarchy' ? 60 : 150)
        .strength(d => d.type === 'hierarchy' ? 0.8 : 0.3)
      )
      .force("charge", d3.forceManyBody().strength(d => (d as GraphNode).type === 'task' ? -800 : -200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 20).iterations(2));

    // Arrow Marker
    defs.append("marker")
      .attr("id", "arrow-head")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Draw Links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => d.type === 'hierarchy' ? "#475569" : "url(#link-gradient)")
      .attr("stroke-width", d => d.type === 'hierarchy' ? 1 : 2)
      .attr("stroke-dasharray", d => d.type === 'hierarchy' ? "3,3" : "none")
      .attr("opacity", 0.6)
      .attr("marker-end", d => d.type === 'dependency' ? "url(#arrow-head)" : null);

    // Draw Nodes
    const node = g.append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Circle Background (Glow)
    node.append("circle")
      .attr("r", d => d.radius + 2)
      .attr("fill", d => getStatusColor(d.status))
      .attr("opacity", 0.1)
      .attr("filter", "url(#glow)");

    // Node Main Circle
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", "#1e293b") // slate-800
      .attr("stroke", d => getStatusColor(d.status))
      .attr("stroke-width", 2)
      .transition().duration(500);

    // Pulse Animation for In-Progress
    function startPulse() {
      node.filter(d => d.status === 'in-progress')
        .select("circle:first-child") // The glow circle
        .transition()
        .duration(1500)
        .attr("r", d => d.radius + 10)
        .attr("opacity", 0.3)
        .transition()
        .duration(1500)
        .attr("r", d => d.radius + 2)
        .attr("opacity", 0.1)
        .on("end", startPulse);
    }
    startPulse();

    // Particles on Dependency Links
    const particles = g.append("g")
      .selectAll(".particle")
      .data(links.filter(l => l.type === 'dependency'))
      .join("circle")
      .attr("class", "particle")
      .attr("r", 2)
      .attr("fill", "#a855f7")
      .attr("opacity", 0);

    function animateParticles() {
      particles.each(function(d) {
        const el = d3.select(this);
        const pathLength = 100; // Abstract length
        
        const animate = () => {
          const source = d.source as any;
          const target = d.target as any;
          
          if (!source.x || !target.x) return; // Safety check

          el.attr("opacity", 0.8)
            .attr("cx", source.x)
            .attr("cy", source.y)
            .transition()
            .duration(1000 + Math.random() * 1000)
            .ease(d3.easeLinear)
            .attrTween("cx", () => t => {
              const sx = source.x;
              const tx = target.x;
              return `${sx + (tx - sx) * t}`;
            })
            .attrTween("cy", () => t => {
              const sy = source.y;
              const ty = target.y;
              return `${sy + (ty - sy) * t}`;
            })
            .on("end", () => {
              el.attr("opacity", 0);
              setTimeout(animate, Math.random() * 2000);
            });
        };
        
        // Start with random delay
        setTimeout(animate, Math.random() * 2000);
      });
    }

    // Wait for simulation to warm up a bit before starting particles
    setTimeout(animateParticles, 1000);

    // Icons / Text inside Node
    node.each(function(d) {
      const el = d3.select(this);
      
      if (d.type === 'task') {
        // Task ID
        el.append("text")
          .text(d.id)
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .attr("fill", "#fff")
          .attr("font-weight", "bold")
          .attr("font-size", "12px");
          
        // Priority Indicator
        if (d.priority && (d.priority === 'high' || d.priority === 'critical')) {
          el.append("circle")
            .attr("cx", d.radius * 0.707)
            .attr("cy", -d.radius * 0.707)
            .attr("r", 6)
            .attr("fill", getPriorityColor(d.priority))
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 2);
        }
      } else {
        // Subtask Dot
         el.append("circle")
          .attr("r", 4)
          .attr("fill", "#94a3b8");
      }
    });

    // Label for Tasks
    node.filter(d => d.type === 'task')
      .append("text")
      .text(d => (d.data as Task).title.length > 15 ? (d.data as Task).title.substring(0, 15) + "..." : (d.data as Task).title)
      .attr("y", d => d.radius + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", "10px")
      .style("pointer-events", "none");

    // Interactions
    node.on("mouseover", (event, d) => {
      setHoveredNode(d);
      
      // Dim all
      node.attr("opacity", 0.2);
      link.attr("opacity", 0.1);
      
      // Highlight connected
      const connectedNodeIds = new Set<string | number>();
      connectedNodeIds.add(d.id);
      
      const connectedLinks = link.filter((l: any) => {
        if (l.source.id === d.id || l.target.id === d.id) {
          connectedNodeIds.add(l.source.id);
          connectedNodeIds.add(l.target.id);
          return true;
        }
        return false;
      });
      
      connectedLinks
        .attr("opacity", 1)
        .attr("stroke-width", 3);
        
      node.filter(n => connectedNodeIds.has(n.id))
        .attr("opacity", 1);
    })
    .on("mouseout", () => {
      setHoveredNode(null);
      node.attr("opacity", 1);
      link.attr("opacity", 0.6).attr("stroke-width", d => d.type === 'hierarchy' ? 1 : 2);
    })
    .on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    svg.on("click", () => setSelectedNode(null));

    // Tick Function
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
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

    return () => {
      simulation.stop();
    };
  }, [tasks]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden">
      <svg ref={svgRef} className="w-full h-full block cursor-move" />
      
      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 w-80 glass-panel border border-slate-700 rounded-xl p-5 shadow-2xl z-50 max-h-[calc(100%-2rem)] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-xs text-slate-500">#{selectedNode.id}</span>
                <h3 className="text-lg font-bold text-slate-100 leading-tight mt-1">{selectedNode.data.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${selectedNode.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : selectedNode.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                {selectedNode.status}
              </span>
              {selectedNode.priority && (
                <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getPriorityColor(selectedNode.priority)} bg-opacity-20 text-opacity-100`} style={{ color: getPriorityColor(selectedNode.priority), backgroundColor: `${getPriorityColor(selectedNode.priority)}33` }}>
                  {selectedNode.priority}
                </span>
              )}
            </div>

            <p className="text-slate-400 text-sm mb-6">{selectedNode.data.description}</p>

            {/* Details Section */}
            {selectedNode.data.details && (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" /> Details
                </h4>
                <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  {selectedNode.data.details}
                </p>
              </div>
            )}

            {/* Test Strategy */}
            {selectedNode.data.testStrategy && (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                   <CheckCircle2 className="w-3 h-3" /> Test Strategy
                </h4>
                <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  {selectedNode.data.testStrategy}
                </p>
              </div>
            )}

             {/* Subtasks List (only for main tasks) */}
             {selectedNode.type === 'task' && (selectedNode.data as Task).subtasks && (selectedNode.data as Task).subtasks.length > 0 && (
               <div className="mt-4">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subtasks</h4>
                 <div className="space-y-2">
                   {(selectedNode.data as Task).subtasks.map((sub) => (
                     <div key={sub.id} className="flex items-start gap-2 text-sm p-2 rounded bg-slate-900/30 border border-slate-800/50">
                       <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${sub.status === 'done' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                       <span className="text-slate-300">{sub.title}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm p-4 rounded-lg border border-slate-800 shadow-xl pointer-events-none">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Graph Legend</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-300">
           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done</div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> In Progress</div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Pending</div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-slate-500 border-dashed"></div> Subtask</div>
           <div className="flex items-center gap-2"><div className="h-0.5 w-4 bg-slate-500/50"></div> Dependency</div>
           <div className="flex items-center gap-2"><div className="h-0.5 w-4 border-t border-slate-500 border-dashed"></div> Hierarchy</div>
        </div>
      </div>
    </div>
  );
};
