/*
    POSTGRESQL CONNECTION
*/
const { Client } = require('pg');
const client = new Client({
    user: 'postgisuser',
    host: 'localhost',
    database: 'gisdb',
    password: 'postgisuser',
    port: 5432,
});

try {
    (async () => {
        await client.connect();
        console.log("Connected to PostGIS Database");

        await client.query('set search_path = public, postgis, accessibility;');
    })();
} catch (e) {
    console.log("Error connecting to PostGIS Database:");
    console.log(e);
    return;
}

const allGeo = async function() {
    let geo;
    try {
        geo = await client.query('SELECT gid, ST_X(ST_Centroid(ST_Envelope(geom))) as centerx, (-1) * ST_Y(ST_Centroid(ST_Envelope(geom))) as centery, ST_asSVG(geom) as path, ST_asText(ST_Envelope(geom)) as box FROM public.edificios;');
    } catch (e) {
        console.log("[POSTGIS] allGeo");
        console.log(e);
        return {};
    }

    var buildings = [];
    for (const row of geo.rows) {
        buildings.push({
            centerx: row['centerx'],
            centery: row['centery'],
            box: row['box'],
            path: row['path'],
            properties: {
                'id': {
                    display: 'ID',
                    value: row['gid'],
                    userinterest: false
                }
            }
        });
    }

    const result = {
        name: "Universidad de Alicante",
        description: "Mapa de la Universidad de Alicante, situada a 15 minutos en coche del centro de la ciudad.",
        buildings: buildings
    };

    return result;
}

const allData = async function() {
    let geo;
    try {
        geo = await client.query(`SELECT e1.gid, 
        ST_X(ST_Centroid(ST_Envelope(e1.geom))) as centerx, 
        (-1) * ST_Y(ST_Centroid(ST_Envelope(e1.geom))) as centery, ST_asSVG(e1.geom) as path, 
        ST_asText(ST_Envelope(e1.geom)) as box,
        array_agg(fp.val) as nearestNames
        FROM public.edificios e1
        LEFT JOIN LATERAL (select le2.gid, ST_Distance(e1.geom, le2.geom) as d, count(*) as c from public.edificios le2 where ST_Distance(e1.geom, le2.geom) < 100 and le2.id != e1.id group by le2.gid order by d asc) e2 on (e2.c > 0)
        LEFT JOIN accessibility.feature_property as fp on (e2.gid = fp.code and fp.p_code = 'name')
        group by e1.gid;`);
    } catch (e) {
        console.log("[POSTGIS] allData");
        console.log(e);
        return {};
    }

    var buildings = [];
    for (const row of geo.rows) {
        const data = await client.query('SELECT property.p_code, p_name, val, userinterest from accessibility.feature_property join accessibility.property on property.p_code = feature_property.p_code where feature_property.code = ' + row['gid'] + ';');
        const properties_array = {};
        for (const property of data.rows) {
            properties_array[property['p_code']] = propertyParser(property);
        }

        properties_array['id'] = {
            "display": "ID",
            "value": row['gid'],
            "userinterest": false
        };

        buildings.push({
            centerx: row['centerx'],
            centery: row['centery'],
            box: row['box'],
            path: row['path'],
            properties: properties_array,
            groups: (await groupsForFeature(row['gid'])),
            nearestnames: row['nearestnames']
        });
    };

    return buildings;
}

const allGroups = async function() {
    let data;
    try {
        data = await client.query('SELECT * from accessibility.groups ORDER BY zoom_level ASC;');
    } catch (e) {
        console.log("[POSTGIS] allGroups");
        console.log(e);
    }

    const groups = Array.apply(null, Array(20)).map(element => []);

    for (const group of data.rows) {
        const affects_raw = await client.query("SELECT count(*) from accessibility.groups join edificios on (edificios.geom <-> ST_GeometryFromText('POINT(' || groups.lat || ' ' || groups.long || ' 0)') <= groups.radius and groups.id = "+ group.id +");")
        groups[group.zoom_level].push({
            id: group.id,
            name: group.g_name,
            lat: group.lat,
            long: group.long,
            zoom: group.zoom_level,
            radius: group.radius,
            affects: affects_raw.rows[0].count
        });
    }

    return groups;
}

const groupsForFeature = async function(id) {
    let data;
    
    try {
        data = await client.query("SELECT groups.zoom_level from accessibility.groups join public.edificios on (edificios.geom <-> postgis.ST_GeometryFromText('POINT(' || groups.lat || ' ' || groups.long || ')') <= groups.radius and edificios.gid = " + id + ");");
    } catch (e) {
        console.log("[POSTGIS] groupsForFeature");
        console.log(e);
        return {};
    }

    const groups = [];
    for (const group of data.rows) {
        groups.push(group.zoom_level);
    }
    
    return groups;
}

const all = async function() {
    let buildings, groups;
    try {
        buildings = await allData();
        groups = await allGroups();
    } catch (e) {
        console.log("[POSTGIS] all");
        console.log(e);
        return {};
    }

    const result = {
        name: "Universidad de Alicante",
        description: "Mapa de la Universidad de Alicante, situada a 15 minutos en coche del centro de la ciudad.",
        buildings: buildings,
        groups: groups
    };

    return result;
}

const dataByBuilding = async function(id) {
    let data;

    try {
        data = await client.query('SELECT feature_property.p_code, p_name, val, userinterest from accessibility.feature_property join accessibility.property on (property.p_code = feature_property.p_code) where feature_property.code = ' + id + ';');
    } catch (e) {
        console.log("[POSTGIS] dataByBuilding");
        console.log(e);
        return {};
    }
    
    const properties_array = {};
    for (const property of data.rows) {
        properties_array[property['p_code']] = propertyParser(property);
    }

    properties_array['id'] = {
        "display": "ID",
        "value": id,
        "userinterest": false
    };

    return properties_array;
}

const searchByName = async function(name) {
    let data;
    try {
        data = await client.query("select gid as id, feature_property.val as name, ST_X(ST_Centroid(ST_Envelope(geom))) as centerx, (-1) * ST_Y(ST_Centroid(ST_Envelope(geom))) as centery from public.edificios join accessibility.feature_property on (edificios.gid = feature_property.code) where feature_property.p_code = 'name' and lower(feature_property.val) like '%"+ name.toLowerCase() +"%';");
    } catch (e) {
        console.log("[POSTGIS] searchByName");
        console.log(e);
        return { code: 400, results: {}};
    }
    return {
        code: 200,
        results: data.rows
    }
}

const djPath = async function(bid1, bid2, disability) {
    let data;
    try {
        data = await client.query(`select dp.*, ST_X(v.the_geom) as vcenterx, (-1) * ST_Y(v.the_geom) as vcentery from dijkstraPath(${bid1}, ${bid2}, false, ${disability}) as dp, routes_noded_vertices_pgr as v where node = v.id;`);
    } catch (e) {
        console.log("[POSTGIS] djPath");
        console.log(e);
        return {};
    }

    return data.rows;
}

const djPathWithPoi = async function(bid1, bid2, disability) {
    let data;
    try {
        data = await client.query(`select dp.*, ST_X(v.the_geom) as vcenterx, (-1) * ST_Y(v.the_geom) as vcentery from dijkstraPathWithPOI(${bid1}, ${bid2}, false, ${disability}) as dp, routes_noded_vertices_pgr as v where node = v.id;`);
    } catch (e) {
        console.log("[POSTGIS] djPathWithPoi");
        console.log(e);
        return {};
    }

    return data.rows;
}

const propertyParser = property => {
    return {
        "display": property['p_name'],
        "value": property['val'],
        "userinterest": property['userinterest']
    };
};

module.exports = {
    all: all,
    allData: allData,
    allGeo: allGeo,
    dataByBuilding: dataByBuilding,
    searchByName: searchByName,
    djPath: djPath,
    djPathWithPoi: djPathWithPoi
}