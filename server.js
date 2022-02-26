const Koa = require('koa');
const app = new Koa();
const fs = require('fs');
const path = require('path');
const compilerSfc = require('@vue/compiler-sfc');
const compilerTpl = require('@vue/compiler-dom');

const JS_EXTNAME = ['.js'];
const CSS_EXTNAME = ['.css'];
const NODE_ENV = 'development';

app.use(async ctx => {
    const { url: requestUrl, query } = ctx.request;
    const extname = path.extname(requestUrl);

    // root
    if (requestUrl === '/') {
        let content = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8');
        content = content.replace(/<script/, `<script>window.process = { env: { NODE_ENV: '${NODE_ENV}' }}</script><script`);
        ctx.body = rewriteDefaultImport(content);
    } else if (JS_EXTNAME.includes(extname)) {
        // js
        const content = fs.readFileSync(path.join(__dirname, requestUrl), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = rewriteDefaultImport(content);
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
        // 第三方模块
        const pkg = require(path.join(__dirname, requestUrl, 'package.json'));
        let entryFile = pkg.module;
        const content = fs.readFileSync(path.join(__dirname, requestUrl, entryFile), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = rewriteDefaultImport(content);
    } else if (extname.includes('.vue')) {
        // vue单文件组件
        const pathUrl = requestUrl.split('?')[0];
        if (!query.type) {
            ctx.type = 'application/javascript;charset=utf-8';
            ctx.body = rewriteDefaultImport(rewriteSfcToFetchRenderFunction(pathUrl));
        } else if (query.type === 'template') {
            ctx.type = 'application/javascript;charset=utf-8';
            ctx.body = rewriteDefaultImport(compileToRenderFunction(pathUrl));
        } else if (query.type === 'style') {
            const css = getContentAfterCompilerSfc(pathUrl).descriptor.styles;
            const source = css.reduce((prev, next) => `${prev}${next.content}`, '');
            ctx.type = 'application/javascript;charset=utf-8';
            ctx.body = 'const css = `' + `${source}` + '`;' + `
                const styleDom = document.createElement('style');
                styleDom.textContent = css;
                document.head.appendChild(styleDom);
            `;
            // const content = compilerSfc.compileStyle({ source, id: `${requestUrl}` });
            // console.log(content)
            // ctx.type = 'text/css;charset=utf-8';
            // ctx.body = content.code;
        }
    } else if (!extname) {
        const content = fs.readFileSync(path.join(__dirname, requestUrl + '.js'), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = rewriteDefaultImport(content);
    }
});

const rewriteDefaultImport = (content) => {
    return content.replace(/(import|export)(.+)from(\s*['"])([^'"]+)(['"])/g, function(str, s1, s2, s3, s4, s5) {
        if (s4.startsWith('.') || s4.startsWith('/')) {
            return str;
        }
        return `${s1}${s2}from${s3}/node_modules/${s4}${s5}`;
    })
}

const getContentAfterCompilerSfc = (pathUrl) => {
    const content = fs.readFileSync(path.join(__dirname, pathUrl), 'utf-8');
    let sfcContent = compilerSfc.parse(content);
    // console.log(sfcContent);
    return sfcContent;
}

const rewriteSfcToFetchRenderFunction = (pathUrl) => {
    let sfcContent = getContentAfterCompilerSfc(pathUrl).descriptor.script.content;
    sfcContent = sfcContent.replace(/export\s+default/, 'const __script =');
    return `${sfcContent}
        import { render as __render } from '${pathUrl}?type=template';
        import '${pathUrl}?type=style';
        __script.render = __render;
        export default __script;
        `;
}

const compileToRenderFunction = (pathUrl) => {
    const tplContent = getContentAfterCompilerSfc(pathUrl).descriptor.template.content;
    const render = compilerTpl.compile(tplContent, { mode: 'module' }).code;
    // const render = compilerSfc.compileTemplate({ source: tplContent, id: `${pathUrl}` }).code;

    return render;
}

app.listen(3000, () => {
    console.log('Server listening http://localhost:3000')
});

app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});