import getHello, { getHello2 } from "./utils";
import './index.css';
import { createApp, h } from 'vue';

createApp({
    render: () => h('div', 'hello vue!')
}).mount('#app');

// import React from 'react';
// import ReactDOM from 'react-dom';

// ReactDOM.render(React.createElement('p', 'hello react!', null), document.querySelector('#reactApp'))

console.log(getHello(), getHello2());