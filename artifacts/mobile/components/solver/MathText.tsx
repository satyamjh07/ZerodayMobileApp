import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColors } from '@/hooks/useColors';

interface MathTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  center?: boolean;
}

export function MathText({ text, fontSize = 14, color, center = false }: MathTextProps) {
  const colors = useColors();
  const textColor = color || colors.text;

  const html = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: transparent;
          color: ${textColor};
          font-family: -apple-system, system-ui, sans-serif;
          font-size: ${fontSize}px;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          align-items: ${center ? 'center' : 'flex-start'};
        }
        .content {
          width: 100%;
          word-wrap: break-word;
        }
        .katex-display {
          margin: 0.5em 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
      </style>
    </head>
    <body>
      <div id="content" class="content">${text.replace(/\n/g, '<br/>')}</div>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          renderMathInElement(document.getElementById('content'), {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\\\[', right: '\\\\]', display: true},
              {left: '\\\\(', right: '\\\\)', display: false}
            ],
            throwOnError: false
          });
          // Notify height
          setTimeout(() => {
            window.ReactNativeWebView.postMessage(document.body.scrollHeight);
          }, 100);
        });
      </script>
    </body>
    </html>
  `, [text, fontSize, textColor, center]);

  const [height, setHeight] = React.useState(fontSize * 2);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        onMessage={(event) => {
          const h = parseInt(event.nativeEvent.data);
          if (h > 0) setHeight(h + 10);
        }}
        style={styles.webview}
        containerStyle={styles.webviewContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  webviewContainer: {
    backgroundColor: 'transparent',
  },
});
