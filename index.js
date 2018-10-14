// Database Layer
const db = require('./postgis');

// HTTPS 
const https = require('https');

/*
    HTTP SERVER
*/
const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(express.static('node_modules'));

app.get('/map/data/b/:id', async (request, response) => {
    const id = request.params.id;
    const data = await db.dataByBuilding(id);
    response.json(data);
});

app.get('/map/data/s/name/:name', async (request, response) => {
    const name = request.params.name;
    const data = await db.searchByName(name);
    response.json(data);
});

app.get('/map/data/p/:id1,:id2,:disability', async (request, response) => {
    let {id1, id2, disability} = request.params;
    const data = await db.djPath(id1, id2, disability);

    if (typeof data == 'undefined' || data.length == 0) {
        disability = 0;
        data = await db.djPath(id1, id2, 0);
    }

    response.json({
        disability: parseInt(disability),
        data: data
    });
});

app.get('/map/data/pi/:id1,:id2,:disability', async (request, response) => {
    let {id1, id2, disability} = request.params;
    let data = await db.djPathWithPoi(id1, id2, disability);
    
    response.json({
        disability: parseInt(disability),
        data: data
    });
});

app.get('/map/data', async (request, response) => {
    const result = await db.all();
    response.json(result);
});

const fs = require('fs');
app.get('/map', (request, response) => {
    fs.readFile(__dirname + '/public/map.html', 'utf8', async (err, html) => {
        if (err) {
            response.send(err.stack);
        } else {
            response.send(html);
        }
    });
});

app.get('/route', (request, response) => {
    fs.readFile(__dirname + '/public/route.html', 'utf8', async (err, html) => {
        if (err) {
            response.send(err.stack);
        } else {
            response.send(html);
        }
    });
});

// HTTP Server setup
https.createServer({
    key: fs.readFileSync('./ssl/localhost.key'),
    cert: fs.readFileSync('./ssl/localhost.cert'),
    requestCert: false,
    rejectUnauthorized: false
}, app).listen(3000);

app.listen(3001);

console.log("[HTTPS] Listening on :3000");
console.log("[HTTP] Listening on :3001");