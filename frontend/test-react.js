const React = require('react');
const ReactDOMServer = require('react-dom/server');

const el = React.createElement('span', { style: { color: 'var(--theme-error)' } }, 'hello');
console.log(ReactDOMServer.renderToString(el));
