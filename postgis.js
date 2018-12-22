/*
    POSTGRESQL CONNECTION
*/
const { Client } = require('pg');
const client = new Client({
    user: 'master',
    host: 'postgis.clxlow4ckw0r.eu-west-3.rds.amazonaws.com',
    database: 'gisdb',
    password: 'lC3Du5P6LIHy',
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
        return [];
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

const allData = async function(radius) {
    let geo;
    try {
        geo = await client.query(`SELECT e.gid, 
        ST_X(ST_Centroid(ST_Envelope(e.geom))) as centerx, 
        (-1) * ST_Y(ST_Centroid(ST_Envelope(e.geom))) as centery, ST_asSVG(e.geom) as path, 
        ST_asText(ST_Envelope(e.geom)) as box,
        nn.radius as nearestnamesradius,
        nn.iname as nearestnames
        from edificios as e, nearestNamesForAll(${radius}) as nn
        where nn.gid = e.gid;`);
    } catch (e) {
        console.log("[POSTGIS] allData");
        console.log(e);
        return [];
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
            nearestnames: row['nearestnames'],
            nearestnamesradius: row['nearestnamesradius']
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
        const affects_raw = await client.query("SELECT count(*) from accessibility.groups join edificios on (edificios.geom <-> postgis.ST_SetSRID(ST_MakePoint(groups.lat, groups.long), 25830) <= groups.radius and groups.id = "+ group.id +");")
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
        data = await client.query("SELECT groups.zoom_level from accessibility.groups join public.edificios on (edificios.geom <-> postgis.ST_SetSRID(ST_MakePoint(groups.lat, groups.long), 25830) <= groups.radius and edificios.gid = " + id + ");");
    } catch (e) {
        console.log("[POSTGIS] groupsForFeature");
        console.log(e);
        return [];
    }

    const groups = [];
    for (const group of data.rows) {
        groups.push(group.zoom_level);
    }
    
    return groups;
}

const all = async function(radius) {
    let buildings, groups;
    try {
        buildings = await allData(radius);
        groups = await allGroups();
    } catch (e) {
        console.log("[POSTGIS] all");
        console.log(e);
        return [];
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
        return [];
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
        name = name.replace(/ /g, '%');
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
        return [];
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
        return [];
    }

    return data.rows;
}

const nearestNamesForFeature = async function(bid, radius) {
    let data;
    try {
        data = await client.query(`select * from nearestNamesForFeature(${bid}, ${radius})`);
    } catch (e) {
        console.log("[POSTGIS] djPathWithPoi");
        console.log(e);
        return [];
    }

    return data.rows;
}

const nearestNamesForPoint = async function(lat, long, radius) {
    let data;
    try {
        data = await client.query(`select * from nearestNamesForPoint(${lat}, ${long}, ${radius});`);
    } catch (e) {
        console.log("[POSTGIS] nearestNamesForPoint");
        console.log(e);
        return [];
    }

    return data.rows;
}

const routesSVG = async function() {
    let data;
    try {
        data = await client.query(`select id::integer, sub_id, ST_asSVG(the_geom) as svg from routes_noded;`);
    } catch (e) {
        console.log("[POSTGIS] routesSVG");
        console.log(e);
        return [];
    }

    return data.rows;
}

const nearestEntrance = async function(buildingId, disability) {
    let data;
    try {
        data = await client.query(`select e.*, ed.name as edname from entrances e, nearestEntrance(${buildingId}, ${disability}) as ne, edificios ed where ne = e.id and ed.__gid = e.for;`);
    } catch (e) {
        console.log("[POSTGIS] nearestEntrance");
        console.log(e);
        return [];
    }

    return data.rows;
}

const getGeoJSON = async function() {
    let data;
    try {
        data = await client.query(`select e.gid, array_agg(fp.p_code) as pname, array_agg(fp.val) as pval, ST_asGeoJSON(ST_Transform(geom, 4326)) as g,
        ST_X(ST_Centroid(geom)) as centerx, (-1) * ST_Y(ST_Centroid(geom)) as centery
        from public.edificios as e, accessibility.feature_property as fp 
        where e.gid = fp.code
        group by gid;`);

        let all = {
            type: "FeatureCollection",
            features: []
        };

        for (const row of data.rows) {
            let properties = {
                centerx: row.centerx,
                centery: row.centery
            };

            for (let i = 0; i < row.pname.length; i++) {
                properties[row.pname[i]] = row.pval[i];
            }

            const geojson = {
                type: "Feature",
                geometry: JSON.parse(row.g),
                properties: properties
            }

            all.features.push(geojson);
        }

        return all;
    } catch (e) {
        console.log("[POSTGIS] getGeoJSON");
        console.log(e);
        return [];
    }
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
    djPathWithPoi: djPathWithPoi,
    nearestNamesForFeature: nearestNamesForFeature,
    routesSVG: routesSVG,
    nearestNamesForPoint: nearestNamesForPoint,
    nearestEntrance: nearestEntrance,
    getGeoJSON: getGeoJSON
}
