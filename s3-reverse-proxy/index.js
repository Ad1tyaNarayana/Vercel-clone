const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_PATH = process.env.BASE_PATH; // S3 Bucket URL

const proxy = httpProxy.createProxyServer();

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];

    //todo Custom domain - DB Query

    const resolvesTo = `${BASE_PATH}/${subdomain}`;
    
    proxy.web(req, res, { target: resolvesTo, changeOrigin: true }, (err) => {
        console.error(err);
    });

});

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;

    if(url === '/') {
        proxyReq.path += 'index.html';
    }
});

app.listen(PORT, () => {
  console.log(`Reverse Proxy Server is running on port ${PORT}`);
});