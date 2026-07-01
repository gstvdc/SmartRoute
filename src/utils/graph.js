import { MinHeap } from './heap.js';

export class Graph {
  constructor() {
    this.vertices = new Map();
  }

  seed(dataArray) {
    for (const item of dataArray) {
      const capitalName = Object.keys(item)[0];
      const capitalData = item[capitalName];
      
      const edges = [];
      if (capitalData.neighbors) {
        for (const [neighborName, distance] of Object.entries(capitalData.neighbors)) {
          edges.push({ to: neighborName, distance: distance });
        }
      }

      this.vertices.set(capitalName, {
        toll: capitalData.toll,
        edges: edges
      });
    }
  }


  getCapitalsList() {
    return Array.from(this.vertices.keys());
  }

  /**
   * Calculates the cheapest path between start and end.
   * cost = (distance / autonomy) * fuelPrice + destination_toll
   */
  dijkstra(start, end, fuelPrice, autonomy) {
    if (!this.vertices.has(start) || !this.vertices.has(end)) {
      return { success: false, error: 'Capital de origem ou destino não existe no grafo.' };
    }

    if (start === end) {
      return { 
        success: true, 
        cost: 0, 
        totalDistance: 0, 
        path: [start], 
        pathDetails: [] 
      };
    }

    const pq = new MinHeap();
    const costs = new Map();
    
    for (const vertex of this.vertices.keys()) {
      costs.set(vertex, Infinity);
    }
    
    costs.set(start, 0);
    pq.insert({ 
      node: start, 
      cost: 0, 
      distance: 0, 
      path: [start], 
      pathDetails: [] 
    });

    const visited = new Set();

    while (pq.heap.length > 0) {
      const current = pq.extractMin();
      const u = current.node;

      if (u === end) {
        return {
          success: true,
          cost: current.cost,
          totalDistance: current.distance,
          path: current.path,
          pathDetails: current.pathDetails
        };
      }

      if (visited.has(u)) continue;
      visited.add(u);

      const vertexData = this.vertices.get(u);
      
      for (const edge of vertexData.edges) {
        const v = edge.to;
        if (visited.has(v)) continue;

        const neighborData = this.vertices.get(v);
        if (!neighborData) continue; 

        const fuelCost = (edge.distance / autonomy) * fuelPrice;
        const tollCost = neighborData.toll;
        const edgeCost = fuelCost + tollCost;
        
        const newTotalCost = current.cost + edgeCost;

        if (newTotalCost < costs.get(v)) {
          costs.set(v, newTotalCost);
          
          const newPath = [...current.path, v];
          const newPathDetails = [...current.pathDetails, {
            from: u,
            to: v,
            distance: edge.distance,
            fuelCost: fuelCost,
            tollCost: tollCost,
            stepCost: edgeCost
          }];

          pq.insert({
            node: v,
            cost: newTotalCost,
            distance: current.distance + edge.distance,
            path: newPath,
            pathDetails: newPathDetails
          });
        }
      }
    }

    return { success: false, error: 'Rota inexistente entre as capitais selecionadas.' };
  }
}
