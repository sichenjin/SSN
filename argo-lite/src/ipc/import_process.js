const createGraph = require('ngraph.graph');
const pageRank = require('ngraph.pagerank');

const runImport = (config, nodesArr, edges) => {
  const graph = createGraph();

  const degreeDict = {};
  const strengthDict = {};


  if (config.hasNodeFile) {
    nodesArr.forEach(node =>
      graph.addNode(node[config.nodes.mapping.id].toString(), {
        id: node[config.nodes.mapping.id].toString(),
        LatY: parseFloat(node[config.nodes.mapping.LatY]),
        LonX: parseFloat(node[config.nodes.mapping.LonX]),
        degree: 0,
        ...node,
      }),
    );
    nodesArr = nodesArr.map(n => ({
      ...n,
      id: n[config.nodes.mapping.id].toString(),
      LatY: parseFloat(node[config.nodes.mapping.LatY]),
      LonX: parseFloat(node[config.nodes.mapping.LonX]),
      degree: 0,
      pagerank: 0,
      closeness: 0,
      betweeness: 0,
    }));
    nodesArr.forEach(n => {
      degreeDict[n.id] = 0;
      strengthDict[n.id] = 0;
    });
  }

  if (config.edges.createMissing) {
    edges.forEach(it => {
      const from = it[config.edges.mapping.fromId].toString();
      const to = it[config.edges.mapping.toId].toString();
      if (!graph.hasNode(from)) {
        graph.addNode(from, { id: from, degree: 0 });
        nodesArr.push({ id: from, degree: 0, pagerank: 0 });
        degreeDict[from] = 0;
      }
      if (!graph.hasNode(to)) {
        graph.addNode(to, { id: to, degree: 0 });
        nodesArr.push({ id: to, degree: 0, pagerank: 0 });
        degreeDict[to] = 0;
      }
    });
  }

  const edgesSet = new Set(
    edges
      .map(
        it =>
          `${it[config.edges.mapping.fromId]}😈${it[config.edges.mapping.toId]
          }`,
      )
      .concat(
        edges.map(
          it =>
            `${it[config.edges.mapping.toId]}😈${it[config.edges.mapping.fromId]
            }`,
        ),
      ),
  );

  const edgesArr = [];
  edgesSet.forEach(it => {
    const [from, to] = it.split('😈');

    let weight = 1;
    if (
      config.edges.mapping.weight !== undefined &&
      it[config.edges.mapping.weight] !== undefined
    ) {
      const w = parseFloat(it[config.edges.mapping.weight]);
      if (!isNaN(w)) weight = w;
    }

    graph.addLink(from, to);
    degreeDict[from] += 1;
    degreeDict[to] += 1;

    strengthDict[from] = (strengthDict[from] || 0) + weight;
    strengthDict[to] = (strengthDict[to] || 0) + weight;
    edgesArr.push({
      source_id: from,
      target_id: to,
      weight: weight,
    });
  });

  const rank = pageRank(graph);

  nodesArr = nodesArr.map(n => ({
    ...n,
    pagerank: rank[n.id],
    degree: degreeDict[n.id],
    strength: strengthDict[n.id],
  }));

  return {
    nodes: nodesArr,
    edges: edgesArr
  };
};

process.on('message', (msg) => {
  const output = runImport(
    msg.config,
    msg.nodesArr,
    msg.edges
  );
  process.send(output);
});


