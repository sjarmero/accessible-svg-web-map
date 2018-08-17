// Database Layer
const db = require('./postgis');

// SVG Motor Layer
const SVGMotor = require('./svgmotor.js');

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

app.get('/map/data', async (request, response) => {
    const result = await db.all();
    response.json(result);
});


app.get('/map/svg', async (request, response) => {
    const data = await db.allGeo();
    const svg = await SVGMotor.fromData(data);
    response.send(svg);
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

app.listen(3000);

console.log("Listening on :3000");