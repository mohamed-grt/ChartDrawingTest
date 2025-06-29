import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
    <title>VisX Tree</title>
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <style>
      body { margin: 0; padding: 0;}
      svg { width: 100%; height: 100vh; }
    </style>

        <script>
      // Override console methods to forward to React Native
      (function () {
        const sendLog = (type, args) => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type, message: args }));
        };

        ['log', 'warn', 'error', 'info'].forEach((level) => {
          const original = console[level];
          console[level] = function (...args) {
            original.apply(console, args);
            sendLog(level, args);
          };
        });
      })();
    </script>
  </head>
  <body>
    <svg></svg>

    <script>
        const data = ${JSON.stringify(data)};

        const width = window.innerWidth;
        const height = window.innerHeight;

        const rectWidth = 100; 
        const rectHeight = 50; 

        const root = d3.hierarchy(data);
        const treeLayout = d3.tree()
          .nodeSize([rectWidth * 1.5, rectHeight * 2])
          .separation((a, b) => (a.parent === b.parent ? 1.5 : 2.5));
        treeLayout(root);

        const svg = d3.select("svg")
          .attr("width", width)
          .attr("height", height);

        // Create a group for all visualization elements
        const g = svg.append("g")
          .attr("transform", "translate(100,50)");


        // 🔍 Compute tree bounding box (dynamically)
        const nodes = root.descendants();
        const xValues = nodes.map(d => d.x);
        const yValues = nodes.map(d => d.y);

        const xMin = d3.min(xValues);
        const xMax = d3.max(xValues);
        const yMin = d3.min(yValues);
        const yMax = d3.max(yValues);

        // Add margins if desired
        const margin = 200;

        const extent = [
          [xMin - margin, yMin - margin],
          [xMax + margin, yMax + margin]
        ];

         console.log("Bounding Box:", extent);

        // Zoom setup - apply to the svg but transform the g element
        svg.call(d3.zoom()
          .scaleExtent([0.3, 2])
          .translateExtent(extent)
          .on("zoom", (event) => {
            g.attr("transform", "translate(0,0) " + event.transform.toString());
          }));

        // Rest of your visualization code (connectors, rects, text) goes here
        // Make sure to append them to the g element, not the svg directly

        // Step-style links
        g.selectAll('g.connector')
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
        g.selectAll('rect')
          .data(root.descendants())
          .enter()
          .append('rect')
          .attr('x', d => d.x - rectWidth / 2)
          .attr('y', d => d.y - rectHeight / 2)
          .attr('width', rectWidth)
          .attr('height', rectHeight)
          .attr('fill', 'steelblue');

        // Labels
        g.selectAll('text')
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

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data;
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'log') {
        console.log('📩 WebView:', ...parsedMessage.message);
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{html: htmlContent}}
        scrollEnabled={false}
        style={styles.webView}
        overScrollMode="never"
        nestedScrollEnabled={false}
        onMessage={handleMessage}
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
