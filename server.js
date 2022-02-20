const Koa = require('koa');
const app = new Koa();
const fs = require('fs');
const path = require('path');

app.use(async ctx => {
    console.log(ctx)
    const requestUrl = ctx.request.url;
    // root
    if (requestUrl === '/') {
        const content = fs.readFileSync(path.resolve(__dirname, './src/index.html'), 'utf-8');
        ctx.body = content;
        return;
    } else if (requestUrl.endsWith('.js')) {
        const content = fs.readFileSync(path.resolve(__dirname, './src' + requestUrl), 'utf-8');
        ctx.type = 'application/javascript;charset=utf-8';
        ctx.body = content;
        return;
    }
    ctx.body = 'Hello World';
});

app.listen(3000, () => {
    console.log('Server listening http://localhost:3000')
});

app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});