import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Task, Subtask } from '../types';
import { X, CheckCircle2, ArrowRight, Minimize2, Network } from 'lucide-react';
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
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  // Show empty state if no tasks
  if (tasks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 max-w-md text-center">
          <div className="bg-muted/50 p-3 rounded-full w-fit mx-auto mb-4">
            <Network className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No tasks to display</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query to view the dependency graph.</p>
        </div>
      </div>
    );
  }

  // Apple System Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#34C759'; // System Green
      case 'in-progress': return '#FF9500'; // System Orange
      case 'pending': return '#8E8E93'; // System Gray
      case 'cancelled': return '#FF3B30'; // System Red
      case 'deferred': return '#AF52DE'; // System Purple
      default: return '#8E8E93';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return '#FF3B30'; // System Red
      case 'high': return '#FF9500'; // System Orange
      case 'medium': return '#007AFF'; // System Blue
      default: return '#8E8E93';
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || tasks.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Flatten data into nodes and links
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // PASS 1: Create all nodes first
    tasks.forEach(task => {
      // Add Main Task Node
      nodes.push({
        id: task.id.toString(),
        type: 'task',
        data: task,
        radius: 25 + (task.subtasks?.length || 0) * 2, // Size based on complexity
        status: task.status,
        priority: task.priority
      });

      // Add Subtask Nodes ONLY if expanded
      if (task.subtasks && expandedNodeIds.has(task.id.toString())) {
        task.subtasks.forEach(subtask => {
          const subtaskId = `${task.id}-${subtask.id}`;
          nodes.push({
            id: subtaskId,
            type: 'subtask',
            data: subtask,
            parentId: task.id.toString(),
            radius: 12,
            status: subtask.status,
            priority: subtask.priority
          });
        });
      }
    });

    // PASS 2: Create all links after all nodes exist
    tasks.forEach(task => {
      // Add Hierarchy Links (parent task -> subtasks)
      if (task.subtasks && expandedNodeIds.has(task.id.toString())) {
        task.subtasks.forEach(subtask => {
          const subtaskId = `${task.id}-${subtask.id}`;
          links.push({
            source: task.id.toString(),
            target: subtaskId,
            type: 'hierarchy'
          });

          // Handle subtask dependencies
          if (subtask.dependencies && subtask.dependencies.length > 0) {
            subtask.dependencies.forEach(depId => {
              // Check if it's a task dependency or subtask dependency
              // Only add link if target node exists (is visible)
              const targetNode = nodes.find(n => {
                // Match either task ID or subtask ID pattern
                return n.id === depId.toString() || n.id === `${task.id}-${depId}`;
              });

              if (targetNode) {
                links.push({
                  source: subtaskId,
                  target: targetNode.id.toString(),
                  type: 'dependency'
                });
              }
            });
          }
        });
      }

      // Add Task Dependency Links
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          // Ensure dependency exists in current node set
          const targetNode = nodes.find(n => n.id === depId.toString());
          if (targetNode) {
            links.push({
              source: task.id.toString(),
              target: depId.toString(),
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
      .attr("stdDeviation", "2")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Link Gradients
    const linkGradient = defs.append("linearGradient")
      .attr("id", "link-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "#007AFF").attr("stop-opacity", 0.4);
    linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "#5856D6").attr("stop-opacity", 0.6);

    // Simulation
    // Ensure all links reference existing node IDs before passing to forceLink
    const nodeIdSet = new Set(nodes.map(n => n.id.toString()));
    const safeLinks = links.filter(l => {
      const s = (l.source as any).toString();
      const t = (l.target as any).toString();
      return nodeIdSet.has(s) && nodeIdSet.has(t);
    });

    // Identify isolated nodes (no dependencies)
    const connectedNodeIds = new Set<string>();
    safeLinks.forEach(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      connectedNodeIds.add(sourceId.toString());
      connectedNodeIds.add(targetId.toString());
    });
    
    // Mark nodes as isolated or connected
    nodes.forEach(node => {
      (node as any).isIsolated = !connectedNodeIds.has(node.id.toString());
    });
    
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(safeLinks)
        .id(d => d.id.toString())
        .distance(d => d.type === 'hierarchy' ? 60 : 150)
        .strength(d => d.type === 'hierarchy' ? 0.8 : 0.3)
      )
      // Adaptive charge: weaker repulsion for isolated nodes
      .force("charge", d3.forceManyBody().strength(d => {
        const node = d as any;
        if (node.isIsolated) {
          return node.type === 'task' ? -150 : -50; // Much weaker for isolated nodes
        }
        return node.type === 'task' ? -800 : -200; // Strong for connected nodes
      }))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      // Stronger collision for tighter packing of isolated nodes
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + (d.isIsolated ? 15 : 20)).iterations(3))
      // Radial force to group isolated nodes in a compact cluster
      .force("radial", d3.forceRadial<GraphNode>(
        (d: any) => d.isIsolated ? 150 : 0, // Pull isolated nodes to a radius
        width / 2,
        height / 2
      ).strength((d: any) => d.isIsolated ? 0.3 : 0))
      // Position force for grid-like arrangement of isolated nodes
      .force("x", d3.forceX<GraphNode>().strength((d: any) => d.isIsolated ? 0.1 : 0.02))
      .force("y", d3.forceY<GraphNode>().strength((d: any) => d.isIsolated ? 0.1 : 0.02))
      // Keep nodes within viewport bounds
      .force("bound", () => {
        const margin = 100;
        nodes.forEach(d => {
          const node = d as any;
          if (node.x !== undefined && node.y !== undefined) {
            node.x = Math.max(margin, Math.min(width - margin, node.x));
            node.y = Math.max(margin, Math.min(height - margin, node.y));
          }
        });
      });

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
      .attr("fill", "hsl(var(--muted-foreground))");

    // Draw Links
    const link = g.append("g")
      .selectAll("line")
      .data(safeLinks)
      .join("line")
      .attr("stroke", d => d.type === 'hierarchy' ? "hsl(var(--border))" : "url(#link-gradient)")
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
      .attr("fill", "hsl(var(--card))") // Theme-aware background
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
      .attr("r", 1.5)
      .attr("fill", "#007AFF")
      .attr("opacity", 0);

    function animateParticles() {
      particles.each(function (d) {
        const el = d3.select(this);

        const animate = () => {
          const source = d.source as any;
          const target = d.target as any;

          if (!source.x || !target.x) return; // Safety check

          el.attr("opacity", 0.6)
            .attr("cx", source.x)
            .attr("cy", source.y)
            .transition()
            .duration(2000 + Math.random() * 2000)
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
              setTimeout(animate, Math.random() * 4000);
            });
        };

        // Start with random delay
        setTimeout(animate, Math.random() * 4000);
      });
    }

    // Wait for simulation to warm up a bit before starting particles
    setTimeout(animateParticles, 1000);

    // Icons / Text inside Node
    node.each(function (d) {
      const el = d3.select(this);

      if (d.type === 'task') {
        // Task ID
        el.append("text")
          .text(d.id)
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .attr("fill", "hsl(var(--foreground))") // Theme-aware text
          .attr("font-weight", "bold")
          .attr("font-size", "12px");

        // Priority Indicator
        if (d.priority && (d.priority === 'high' || d.priority === 'critical')) {
          el.append("circle")
            .attr("cx", d.radius * 0.707)
            .attr("cy", -d.radius * 0.707)
            .attr("r", 6)
            .attr("fill", getPriorityColor(d.priority))
            .attr("stroke", "hsl(var(--card))")
            .attr("stroke-width", 2);
        }
      } else {
        // Subtask Dot
        el.append("circle")
          .attr("r", 4)
          .attr("fill", "hsl(var(--muted-foreground))");
      }
    });

    // Label for Tasks
    node.filter(d => d.type === 'task')
      .append("text")
      .text(d => (d.data as Task).title.length > 15 ? (d.data as Task).title.substring(0, 15) + "..." : (d.data as Task).title)
      .attr("y", d => d.radius + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--muted-foreground))")
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
        
        // Toggle expansion for task nodes
        if (d.type === 'task') {
          setExpandedNodeIds(prev => {
            const next = new Set(prev);
            if (next.has(d.id.toString())) {
              next.delete(d.id.toString());
            } else {
              next.add(d.id.toString());
            }
            return next;
          });
        }
        
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
  }, [tasks, expandedNodeIds]); // Re-run when expansion changes

  return (
    <div ref={containerRef} className="relative w-full h-full bg-card overflow-hidden">
      <svg ref={svgRef} className="w-full h-full block cursor-move" />

      {/* Collapse All Button */}
      <AnimatePresence>
        {expandedNodeIds.size > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpandedNodeIds(new Set())}
            className="absolute top-4 left-4 clean-card px-4 py-2 shadow-lg z-50 bg-background/95 backdrop-blur-xl hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Minimize2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-medium text-foreground">Collapse All</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 w-80 clean-card p-5 shadow-xl z-50 max-h-[calc(100%-2rem)] overflow-y-auto bg-background/95 backdrop-blur-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-xs text-muted-foreground">#{selectedNode.id}</span>
                <h3 className="text-lg font-semibold text-foreground leading-tight mt-1">{selectedNode.data.title}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase border ${selectedNode.status === 'done' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : selectedNode.status === 'in-progress' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                {selectedNode.status}
              </span>
              {selectedNode.priority && (
                <span className="px-2 py-1 rounded-full text-[10px] font-medium uppercase bg-primary/5 text-primary border border-primary/10">
                  {selectedNode.priority}
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-sm mb-6">{selectedNode.data.description}</p>

            {/* Details Section */}
            {selectedNode.data.details && (
              <div className="mb-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" /> Details
                </h4>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                  {selectedNode.data.details}
                </p>
              </div>
            )}

            {/* Test Strategy */}
            {selectedNode.data.testStrategy && (
              <div className="mb-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Test Strategy
                </h4>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                  {selectedNode.data.testStrategy}
                </p>
              </div>
            )}

            {/* Subtasks List (only for main tasks) */}
            {selectedNode.type === 'task' && (selectedNode.data as Task).subtasks && (selectedNode.data as Task).subtasks.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Subtasks</h4>
                <div className="space-y-2">
                  {(selectedNode.data as Task).subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30 border border-border/50">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${sub.status === 'done' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className="text-foreground">{sub.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 clean-card p-4 rounded-lg border border-border/50 shadow-lg pointer-events-none bg-background/90 backdrop-blur-md">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Graph Legend</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#34C759]"></div> Done</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF9500]"></div> In Progress</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#8E8E93]"></div> Pending</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-[#8E8E93] border-dashed"></div> Subtask</div>
          <div className="flex items-center gap-2"><div className="h-0.5 w-4 bg-[#8E8E93]/50"></div> Dependency</div>
          <div className="flex items-center gap-2"><div className="h-0.5 w-4 border-t border-[#8E8E93] border-dashed"></div> Hierarchy</div>
        </div>
      </div>
    </div>
  );
};
