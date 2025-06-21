import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';

function App(): React.JSX.Element {
  const data = {
    name: 'Root',
    children: [
      {
        name: 'Child 1',
        children: [{name: 'Grandchild 1'}],
      },
      {
        name: 'Child 2',
        children: [{name: 'Grandchild 2'}, {name: 'Grandchild 3'}],
      },
    ],
  };

  const htmlContent: string = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>VisX Tree</title>
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <style>
      body { margin: 0; padding: 0; }
      svg { width: 100%; height: 100vh; }
    </style>
  </head>
  <body>
    <svg></svg>
    <p id="demo"></p>

    <script>
      const data = ${JSON.stringify(data)};

      const width = window.innerWidth;
      const height = window.innerHeight;

      const rectWidth = 100; 
      const rectHeight = 50; 

      const root = d3.hierarchy(data);
      const treeLayout = d3.tree().size([width, height - 40]);
      treeLayout(root);

      const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(20,20)");

      // Step-style links
      //Draw shared connectors for parents
      svg.selectAll('g.connector')
        .data(root.descendants().filter(d => d.children))
        .enter()
        .append('g')
        .attr('class', 'connector')
        .each(function(d) {
          const g = d3.select(this);
          const children = d.children;
      
          const minX = d3.min(children, c => c.x);
          const maxX = d3.max(children, c => c.x);
          const midY = d.y + (children[0].y - d.y) / 2; // halfway down to children
      
          // Vertical line from parent to midY
          g.append('path')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .attr('d', \`M\${d.x},\${d.y} V\${midY}\`);
      
          // Horizontal bus line connecting all children x at midY
          g.append('path')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 1.5)
            .attr('d', \`M\${minX},\${midY} H\${maxX}\`);
      
          // Vertical drop lines to each child
          children.forEach(c => {
            g.append('path')
              .attr('fill', 'none')
              .attr('stroke', 'black')
              .attr('stroke-width', 1.5)
              .attr('d', \`M\${c.x},\${midY} V\${c.y}\`);
            });
          });

      // Nodes (rectangles)
      svg.selectAll('rect')
        .data(root.descendants())
        .enter()
        .append('rect')
        .attr('x', d => d.x - rectWidth / 2)
        .attr('y', d => d.y - rectHeight / 2)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('fill', 'steelblue');

      // Labels
      svg.selectAll('text')
        .data(root.descendants())
        .enter()
        .append('text')
        .attr('x', d => d.x - rectWidth / 2 + 5)
        .attr('y', d => d.y + 5)
        .attr('fill', 'white')
        .text(d => d.data.name);

     
    </script>


  </body>
  </html>
`;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{html: htmlContent}}
        style={styles.webView}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});

export default App;
