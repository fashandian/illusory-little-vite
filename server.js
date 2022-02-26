const Koa = require('koa');
const app = new Koa();
const fs = require('fs');
const path = require('path');

const JS_EXTNAME = ['.js'];
const CSS_EXTNAME = ['.css'];
const NODE_ENV = 'development';

app.use(async ctx => {
    const requestUrl = ctx.request.url;
    const extname = path.extname(requestUrl);
    // root
    if (requestUrl === '/') {
        let content = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8');
        content = content.replace(/<script/, `<script>window.process = { env: { NODE_ENV: '${NODE_ENV}' }}</script><script`);
        ctx.body = rewriteImport(content);
    } else if (JS_EXTNAME.includes(extname)) {
        // js
        const content = fs.readFileSync(path.join(__dirname, requestUrl), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = rewriteImport(content);
    } else if (CSS_EXTNAME.includes(extname)) {
        // css
        const content = fs.readFileSync(path.join(__dirname, requestUrl), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = 'const css = `' + `${content}` + '`;' + `
            const styleDom = document.createElement('style');
            styleDom.textContent = css;
            document.head.appendChild(styleDom);
        `;
    } else if (requestUrl.startsWith('/node_modules/')) {
        const pkg = require(path.join(__dirname, requestUrl, 'package.json'));
        let entryFile = pkg.module;
        const content = fs.readFileSync(path.join(__dirname, requestUrl, entryFile), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = rewriteImport(content);
    } else if (!extname) {
        const content = fs.readFileSync(path.join(__dirname, requestUrl + '.js'), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = rewriteImport(content);
    }
});

const rewriteImport = (content) => {
    return content.replace(/(import|export)(.+)from(\s*['"])([^'"]+)(['"])/g, function(str, s1, s2, s3, s4, s5) {
        if (s4.startsWith('.') || s4.startsWith('/')) {
            return str;
        }
        return `${s1}${s2}from${s3}/node_modules/${s4}${s5}`;
    })
}

app.listen(3000, () => {
    console.log('Server listening http://localhost:3000')
});

app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});