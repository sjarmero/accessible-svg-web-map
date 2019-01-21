// Database Layer
const db = require('./postgis');

// HTTPS 
const https = require('https');

// File system
const fs = require('fs');
const path = require('path');
var rfs = require('rotating-file-stream')

/*
    HTTP SERVER
*/
const express = require('express');
const app = express();

app.get('/map/data/geojson/:r', async (request, response) => {
    const r = request.params.r;
    const data = await db.getGeoJSON(r);
    response.json(data);
});

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
    console.log(data.length);
    if (typeof data == 'undefined' || data.length == 0) {
        disability = 0;
        data = await db.djPath(id1, id2, 0);
    }

    let entrance = await db.nearestEntrance(id1, disability);
    
    response.json({
        disability: parseInt(disability),
        entrance: entrance,
        data: data
    });
});


app.get('/map/data/nn4f/:bid,:radius', async (request, response) => {
    let {bid, radius} = request.params;
    let data = await db.nearestNamesForFeature(bid, radius);
    
    response.json(data);
});

app.get('/map/data/nn4p/:lat,:long,:radius', async (request, response) => {
    let {lat, long, radius} = request.params;
    let data = await db.nearestNamesForPoint(lat, long, radius);
    
    response.json(data);
});


app.get('/map/data/rsvg', async (request, response) => {
    const data = await db.routesSVG();
    response.json(data);
});

app.get('/map/data/tab/we', async (request, response) => {
    const data = await db.getWETabOrder();
    
    let o = {};
    let i = 1;
    for (const on of data) {
        o[on.id] = i;
        i++;
    }

    response.json(o);
});

app.get('/map/data/:radius', async (request, response) => {
    let {radius} = request.params;
    const result = await db.all(radius);
    response.json(result);
});

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

app.get('/settings', (request, response) => {
    fs.readFile(__dirname + '/public/settings.html', 'utf8', async (err, html) => {
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