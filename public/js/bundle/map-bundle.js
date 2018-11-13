!function(t){var e={};function a(n){if(e[n])return e[n].exports;var o=e[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,a),o.l=!0,o.exports}a.m=t,a.c=e,a.d=function(t,e,n){a.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},a.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},a.t=function(t,e){if(1&e&&(t=a(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(a.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)a.d(n,o,function(e){return t[e]}.bind(null,o));return n},a.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return a.d(e,"a",e),e},a.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},a.p="",a(a.s=5)}([function(t,e,a){"use strict";a.d(e,"a",function(){return n});var n=function(){function t(){this.ZOOM_LEVEL_BASE=.000246153846,this.ZOOM_LEVEL_STEP=.4514682741,this.MAX_GROUP_LEVEL=4,this._svg=SVG("map"),this._svg.attr("version","1.1"),this._svg.attr("role","graphics-document document"),this._zoomlevel=3,this._container="#map svg ",this.guides_drawn=!1,this.marker_groups=Array.apply(null,Array(20)).map(function(t){return[]}),this.auto_marker_groups=Array.apply(null,Array(20)).map(function(t){return[]}),this.auto_grouped_buildings=[]}return Object.defineProperty(t,"instance",{get:function(){return this._instance||(this._instance=new t),this._instance},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"svg",{get:function(){return this._svg},set:function(t){this._svg=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"zoomlevel",{get:function(){return this._zoomlevel},set:function(t){this._zoomlevel=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"container",{get:function(){return this._container},set:function(t){this._container=t},enumerable:!0,configurable:!0}),t.prototype.fetchData=function(){var t=this;if(void 0===this._data){var e=Cookies.get("locationRadio")||100;return $.getJSON("/map/data/"+e,function(t){return t})}new Promise(function(e,a){e(t._data)})},Object.defineProperty(t.prototype,"data",{get:function(){return this._data},set:function(t){this._data=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"guidesDrawn",{get:function(){return this.guides_drawn},set:function(t){this.guides_drawn=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fullw",{get:function(){return this.svg.viewbox().width},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"fullh",{get:function(){return this.svg.viewbox().height},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"onDrawn",{set:function(t){this.onmapdrawn=t},enumerable:!0,configurable:!0}),t.prototype.draw=function(){var t=this;this.fetchData().then(function(e){t.data=e,t.svg.attr("id","this.svg_MAIN"),t.svg.attr("preserveAspectRatio","xMidYMid slice"),t.svg.attr("class","map-dragable"),t.svg.attr("tabindex",0);for(var a=t.svg.group().attr("id","SVG_MAIN_CONTENT").front(),n=function(e){var n=a.group().link("#feature-"+e.properties.id.value).attr("class","non-link building-wrapper feature-object").attr("id","link-feature-"+e.properties.id.value);n.attr("data-building",e.properties.id.value),n.attr("role","graphics-symbol img"),n.attr("data-name",e.properties.name.value),n.attr("data-coords",e.centerx+":"+e.centery),n.attr("data-description",e.properties.description.value),n.attr("data-nearest",e.nearestnames.reduce(function(t,e){return t+","+e})),n.attr("data-nearest-radius",e.nearestnamesradius);var o=n.path().attr("d",e.path);o.attr("id","feature-shape-"+e.properties.id.value),o.attr("class","building");var i=n.group().attr("id","marker-"+e.properties.id.value).attr("class","map-marker"),r=i.image("/images/building_marker.svg",14,14);r.attr("class","marker"),r.attr("x",e.centerx-15),r.attr("y",e.centery-7);var s=i.text(function(t){for(var a=e.properties.name.value.split(" "),n=[a[0]],o=1;o<a.length;o++){var i=a[o];n[n.length-1].length+i.length<=10||null!=i.match(/^(,|.|;|:|")$/i)?n[n.length-1]+=" "+i:n.push(i)}for(o=0;o<n.length;o++)0==o?t.tspan(n[o]):t.tspan(n[o]).move(e.centerx,e.centery).dy(5*o)});s.attr("text-anchor","start"),s.attr("id","label-"+(e.properties.id?e.properties.id.value:"")),s.attr("x",e.centerx),s.attr("y",e.centery),s.font({weight:"bold"}),n.attr("aria-labelledby","label-"+e.properties.id.value);for(var c=0,l=e.groups;c<l.length;c++){var u=l[c];t.marker_groups[u].push(e.properties.id.value)}},o=0,i=t.data.buildings;o<i.length;o++){n(i[o])}t.onmapdrawn()})},t.prototype.drawLocation=function(t,e){console.log("Location update",t,e);var a=$(this.container+"#locationg");if(0==a.length){var n=this.svg.select("#SVG_MAIN_CONTENT").members[0].group().front();n.attr("id","locationg");var o=n.circle().radius(10);o.cx(t).cy(e),o.fill("deeppink")}else a.find("circle").attr("cx",t),a.find("circle").attr("cy",e)},t.prototype.drawOrientation=function(e,a,n){var o=$(this.container+"#orientationg");if(0==o.length){var i=this.svg.select("#SVG_MAIN_CONTENT").members[0].group().front();i.attr("id","orientationg");var r=i.image("/images/arrow.svg");r.move(e-8,a-24),r.attr("width",16),r.attr("height",16)}else o.find("image").attr("x",e-8),o.find("image").attr("y",a-24);var s=n<0?n+360:n;$(t.instance.container+"#orientationg image").css({"transform-origin":e+"px "+a+"px",transform:"rotateZ("+s+"deg)"}),o.attr("data-orientation",s),o.attr("data-x",e),o.attr("data-y",a)},t.prototype.drawGuides=function(){if(!(this.zoomlevel>=this.MAX_GROUP_LEVEL)){$(this.container+".jails").remove();for(var t=this.svg.group().addClass("jails").back(),e=this.zoomlevel,a=100/e+"%",n=this.svg.viewbox(),o=n.x,i=n.y,r=this.fullw/e,s=this.fullh/e,c=0;c<e;c++)for(var l=0;l<e;l++)t.rect(a,a).move(o+c*r,i+l*s).fill("transparent").stroke({width:1})}},t.prototype.calculateAutoGroups=function(){if(!(this.zoomlevel>=this.MAX_GROUP_LEVEL)){this.drawGuides();for(var t=Array.apply(null,Array(20)).map(function(t){return[]}),e=0,a=this.data.groups;e<a.length;e++)for(var n=a[e],o=0;o<n.length;o++){var i=n[o];console.log(i),i.auto&&t[n].push(o)}for(var r=0,s=t;r<s.length;r++)for(var c=0,l=n=s[r];c<l.length;c++){var u=l[c];this.data.groups.splice(u,1)}for(var d=0,p=this.svg.select(".jails rect").members;d<p.length;d++){var v=p[d],h=!1;for(o=0;o<this.data.groups[this.zoomlevel].length;o++){var f=this.data.groups[this.zoomlevel][o];if(v.inside(f.lat,f.long)){h=!0;break}}if(!h){var m=0,g=void 0;for(o=0;o<this.data.buildings.length;o++){var b=this.data.buildings[o],y=b.centerx,w=b.centery;v.inside(y,w)&&-1==b.groups.indexOf(this.zoomlevel)&&(m++,-1==this.marker_groups[this.zoomlevel].indexOf(parseInt(b.properties.id.value))&&this.marker_groups[this.zoomlevel].push(parseInt(b.properties.id.value)),(void 0==g||parseInt(b.properties.priority.value)<parseInt(g.properties.priority.value))&&(g=b))}0!=m&&this.data.groups[this.zoomlevel].push({id:parseInt(g.centerx).toString()+parseInt(g.centery).toString(),affects:m,lat:g.centerx,long:g.centery,name:"Marcadores cerca de "+g.properties.name.value,radius:v.width()/2,auto:!0})}}}},t.prototype.groupMarkers=function(t){var e=0;this.calculateAutoGroups();for(var a=[],n=0,o=this.marker_groups;n<o.length;n++){for(var i=0,r=o[n];i<r.length;i++){var s=r[i];e==t?a.push(s):($("#link-feature-"+s).removeAttr("tabindex"),$("#link-feature-"+s).removeClass("non-clickable"),this.svg.select("#marker-"+s).show())}for(var c=0,l=this.data.groups[e];c<l.length;c++){var u=l[c];if(e==t){var d=1==u.affects.toString().length?1:u.affects.toString().length/2,p=this.svg.select("#SVG_MAIN_CONTENT").members[0].link("#gmarker-"+u.id).attr("class","non-link gmarker").attr("id","gmarker-"+u.id);p.attr("data-name",u.name);var v=p.group(),h=v.circle().radius(10);h.cx(u.lat).cy(u.long);var f=v.plain(u.affects).attr("text-anchor","middle");f.font({size:16/d}),f.move(u.lat,u.long-8/d),p.title(u.name).attr("id","gmarker-"+u.id+"-title"),p.attr("aria-labelledby","gmarker-"+u.id+"-title"),p.attr("data-coords",h.cx()+":"+h.cy()),f.attr("aria-hidden","true"),f.attr("role","presentation")}else for(var m=0,g=this.svg.select("#gmarker-"+u.id).members;m<g.length;m++){g[m].remove()}}e++}for(var b=0,y=a;b<y.length;b++){s=y[b];this.svg.select("#marker-"+s).hide(),$("#link-feature-"+s).attr("tabindex","-1"),$("#link-feature-"+s).addClass("non-clickable")}var w=this;$(this.container+"a.gmarker").on("focus",function(){$(this).on("keyup",function(t){if(13==t.which){t.preventDefault(),w.zoomlevel+=2;var e=$(this).attr("data-coords").split(":"),a=e[0],n=e[1];w.zoomAndMove(a,n,w.zoomlevel)}})}),$(this.container+"a.gmarker").on("click",function(t){t.preventDefault(),w.zoomlevel+=2;var e=$(this).attr("data-coords").split(":"),a=e[0],n=e[1];w.zoomAndMove(a,n,w.zoomlevel)}),this.updateSidebar()},t.prototype.isInview=function(e){var a=t.instance.svg.viewbox().x,n=t.instance.svg.viewbox().y,o=a+t.instance.svg.viewbox().width,i=n+t.instance.svg.viewbox().height,r=$(e).attr("data-coords"),s=parseFloat(r.split(":")[0]),c=parseFloat(r.split(":")[1]);return s>=a&&s<=o&&(c>=n&&c<=i)},t.prototype.updateSidebar=function(){var t=this;$("#currentViewPanel ul").empty(),this.zoomlevel<this.MAX_GROUP_LEVEL?$(this.container+".gmarker").each(function(e,a){var n=t.isInview(a);if($(a).attr("data-inview",String(n)),n){var o=$(a).attr("data-name"),i=$(a).attr("data-coords").split(":")[0],r=$(a).attr("data-coords").split(":")[1],s=document.createElement("li"),c=document.createElement("a");$(c).html("Grupo: "+o),$(c).attr("href","#"),$(c).attr("data-type","group"),$(c).attr("data-listened",String(!1)),$(c).attr("data-x",i),$(c).attr("data-y",r),$(s).append(c),$("#currentViewPanel ul").append(s)}}):$(this.container+"a.feature-object").each(function(e,a){var n=t.isInview(a);if($(t).attr("data-inview",String(n)),n){var o=$(a).attr("data-coords"),i=parseFloat(o.split(":")[0]),r=parseFloat(o.split(":")[1]),s=document.createElement("li"),c=document.createElement("a");$(c).html("Edificio: "+$(a).attr("data-name")),$(c).attr("href","#"),$(c).attr("data-id",$(a).attr("data-id")),$(c).attr("data-x",i),$(c).attr("data-y",r),$(s).append(c),$("#currentViewPanel ul").append(s)}})},t.prototype.getZoomValues=function(t,e){var a=$("#map").width();return{vbx:a/=this.ZOOM_LEVEL_BASE+(t-1)*this.ZOOM_LEVEL_STEP,wdiff:e?(this.svg.viewbox().width-a)/2:0}},t.prototype.resizeToLevel=function(t,e){var a=this;if(void 0===e&&(e=!0),!(t<2||t>21)){$(this.container+".jails").remove(),this.zoomlevel=t;var n=this.getZoomValues(t,e),o=n.vbx,i=n.wdiff;(e?this.svg.animate({duration:250}):this.svg).viewbox(this.svg.viewbox().x+i,this.svg.viewbox().y+i,o,o),window.location.href="#zoom="+t,setTimeout(function(){a.groupMarkers(t),a.updateSidebar()},400)}},t.prototype.move=function(t,e,a){var n=this;void 0===a&&(a=!0),(a?this.svg.animate({duration:250}):this.svg).viewbox(this.svg.viewbox().x+t,this.svg.viewbox().y+e,this.svg.viewbox().width,this.svg.viewbox().height),setTimeout(function(){n.updateSidebar()},400)},t.prototype.moveTo=function(t,e,a){var n=this;void 0===a&&(a=!0),(a?this.svg.animate({duration:250}):this.svg).viewbox(t-this.fullw/2,e-this.fullh/2,this.svg.viewbox().width,this.svg.viewbox().height),setTimeout(function(){n.updateSidebar()},400)},t.prototype.zoomAndMove=function(t,e,a,n){var o=this;void 0===n&&(n=!0),$(this.container+".jails").remove(),this.zoomlevel=a;var i=this.getZoomValues(a,!0),r=i.vbx,s=i.wdiff;(n?this.svg.animate({duration:250}):this.svg).viewbox(t-this.fullw/2+s,e-this.fullh/2+s,r,r),window.location.href="#zoom="+a,setTimeout(function(){o.groupMarkers(a),o.updateSidebar()},400)},t}()},function(t,e,a){"use strict";a.d(e,"a",function(){return r});var n=a(0),o=a(2),i=a(3),r=function(){function t(){this.voice=new o.a,proj4.defs("EPSG:25830","+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs")}return Object.defineProperty(t,"instance",{get:function(){return t._instance||(t._instance=new t),t._instance},enumerable:!0,configurable:!0}),t.prototype.pageLoad=function(){n.a.instance.onDrawn=function(){setTimeout(function(){n.a.instance.groupMarkers(n.a.instance.zoomlevel)},100);var t=null,e=new i.a;e.watch(function(e,a){var o=proj4("EPSG:4326","EPSG:25830",[a,e]),i=o[0],r=o[1];t={x:i,y:-r},n.a.instance.drawLocation(i,-r)}),e.watchOrientation(function(e,a,o){null!=t&&n.a.instance.drawOrientation(t.x,t.y,e)}),n.a.instance.updateSidebar()},n.a.instance.draw()},Object.defineProperty(t.prototype,"voiceControl",{get:function(){return this.voice},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"onSearchVoiceQuery",{get:function(){return this.searchResultCallback},set:function(t){this.searchResultCallback=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"onSearchResultSelected",{get:function(){return this.searchResultSelected},set:function(t){this.searchResultSelected=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"onRouteCommand",{get:function(){return this.routeCommand},set:function(t){this.routeCommand=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"onUnknownVoiceCommand",{get:function(){return this.uvc},set:function(t){this.uvc=t},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"searchResultsForVoiceSelection",{get:function(){return this.srfvs},set:function(t){this.srfvs=t},enumerable:!0,configurable:!0}),t.prototype.startVoice=function(){var t=this;o.a.compatible()&&(o.a.setOn(!0),this.voice.start(function(e){var a=e.confidence,n=e.transcript;console.log("Voice received:"),console.log(a,n);var o=t.voice.parseAction(n);if(o)switch(console.log("Parsed as",o),o.name){case"unknown":return void t.onUnknownVoiceCommand();case"search":return void t.onSearchVoiceQuery(o.query);case"select":return void t.onSearchResultSelected(t.toDigit(o.item));case"route":return void t.onRouteCommand({origin:o.origin,target:o.target});case"access-routes":return void t.onRouteCommand(null);case"zoom":return void t.navigationHandler("acercar"===o.direction?"zoom-in":"zoom-out");default:return void t.navigationHandler(o.direction)}}))},t.prototype.stopVoice=function(){o.a.compatible()&&void 0!==this.voice&&(o.a.setOn(!1),this.voice.stop())},t.prototype.navigationHandler=function(t){var e=20-n.a.instance.zoomlevel+15,a=0,o=0;switch(t){case"up":o=-e;break;case"down":o=e;break;case"left":a=-e;break;case"right":a=e;break;case"zoom-in":return n.a.instance.zoomlevel=20==n.a.instance.zoomlevel?n.a.instance.zoomlevel:n.a.instance.zoomlevel+1,void n.a.instance.resizeToLevel(n.a.instance.zoomlevel);case"zoom-out":return n.a.instance.zoomlevel=1==n.a.instance.zoomlevel?n.a.instance.zoomlevel:n.a.instance.zoomlevel-1,void n.a.instance.resizeToLevel(n.a.instance.zoomlevel)}n.a.instance.move(a,o)},t.prototype.toDigit=function(t){var e=["uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez"];console.log(e.length,t);for(var a=0;a<e.length;a++)if(e[a]==t)return a+1;return-1},t}()},function(t,e,a){"use strict";var n=[{name:"antiloop",pattern:/(No te he entendido)|(El mapa está ahora escuchando)/i,extract:[]},{name:"move",pattern:/(mover) (mapa |mapas |plano )?(a |hacia |para )?(la derecha|la izquierda|arriba|abajo)/i,extract:[{name:"direction",position:4}]},{name:"zoom",pattern:/(alejar|acercar)( mapa)?/i,extract:[{name:"direction",position:1}]},{name:"search",pattern:/(buscar) ([\w | \d]+)+/i,extract:[{name:"query",position:2}]},{name:"select",pattern:/(seleccionar |elegir |escoger |ver )(número |resultado )*(\w+)+/i,extract:[{name:"item",position:3}]},{name:"access-routes",pattern:/i((acceder a)|(acceso a)|(ir a)) (((cálculo de)|(calcular)|(calculo de))+ )*(ruta)/i,extract:[]},{name:"route",pattern:/((ir )|(calcular ruta ))*desde ((\w|\d| )+) hasta ((\w|\d| )+)/i,extract:[{name:"origin",position:4},{name:"target",position:6}]}];a.d(e,"a",function(){return o});var o=function(){function t(){this.time_per_word=500,t.compatible()&&(this.list=new webkitSpeechGrammarList,this.list.addFromString(""),this.voice=new webkitSpeechRecognition,this.voice.lang="es-ES",this.voice.interimResults=!1,this.voice.maxAlternatives=1,this.voice.grammars=this.list,this.voice.continuous=!0),this.container=document.getElementById("speech")}return t.compatible=function(){return"undefined"!=typeof SpeechRecognition||"undefined"!=typeof webkitSpeechRecognition},t.isOn=function(){return this.on},t.setOn=function(t){this.on=t},t.prototype.say=function(e){var a=this,n=t.isOn();t.setOn(!1),this.stop(),this.container.innerHTML="",this.container.innerHTML=e,setTimeout(function(){t.setOn(n),a.start(a.onTranscript)},this.time_per_word*e.split(" ").length)},t.prototype.start=function(e){var a=this;if(console.log(t.isOn()),t.isOn()){this.onTranscript=e,this.voice.onresult=function(t){a.voice.stop();var n=t.results.length-1,o=t.results[n][0].transcript,i=t.results[n][0].confidence;i>=.75?e({confidence:i,transcript:o}):(console.log("Ignoring because of low confidence:"),console.log("("+i+") "+o))},this.voice.onend=function(){var a=this;console.log("Voice end and on="+t.isOn()),t.isOn()&&setTimeout(function(){a.start(e)},1e3)};try{this.voice.start()}catch(t){}console.log("Voice started...")}},t.prototype.stop=function(){this.voice.stop()},t.prototype.parseAction=function(t){var e=function(t){for(var e=0,a=n;e<a.length;e++){var o=a[e],i=t.match(o.pattern);if(null!=i){for(var r={name:o.name},s=0,c=o.extract;s<c.length;s++){var l=c[s];r[l.name]=i[l.position]}return r}}return{name:"unknown"}}(t);if(console.log(e),"move"==e.name)switch(e.direction){case"la derecha":e.direction="right";break;case"la izquierda":e.direction="left";break;case"arriba":e.direction="up";break;case"abajo":e.direction="down";break;default:e.direction=null}else if("zoom"===e.action)switch(e.direction){case"alejar":e.direction="zoom-out";break;case"acercar":e.direction="zoom-in";break;default:e.direction=null}return e},t.on=!1,t}()},function(t,e,a){"use strict";a.d(e,"a",function(){return n});var n=function(){function t(){this.orientationAccum=0}return t.prototype.isGeolocationAvailable=function(){return"geolocation"in navigator},t.prototype.watch=function(t){this.isGeolocationAvailable()&&navigator.geolocation.watchPosition(function(e){t(e.coords.latitude,e.coords.longitude)},function(t){console.log("[LOCATION WATCH] error",t)},{enableHighAccuracy:!0,maximumAge:3e4,timeout:27e3})},t.prototype.getCurrentPosition=function(t){navigator.geolocation.getCurrentPosition(function(e){t(e.coords.latitude,e.coords.longitude)},function(t){console.log("[LOCATION GET] error",t)},{enableHighAccuracy:!0,maximumAge:3e4,timeout:27e3})},t.prototype.watchOrientation=function(t){var e=this;window.addEventListener("deviceorientation",function(a){50==e.orientationAccum?(e.orientationAccum=0,t(a.alpha,a.beta,a.gamma)):e.orientationAccum++})},t}()},function(t,e,a){"use strict";a.r(e);var n=a(0),o=a(1);$(document).ready(function(){window.gsvg=n.a.instance.svg,o.a.instance.pageLoad(),n.a.instance.moveTo(717444.93870502,-4251399.25399798);var t=!1;$("body").not("input").not("textarea").keydown(function(e){if(t=t||18==e.which){var a="";switch(e.which){case 189:case 171:a="zoom-out";break;case 187:case 173:a="zoom-in";break;case 38:a="up";break;case 40:a="down";break;case 37:a="left";break;case 39:a="right"}o.a.instance.navigationHandler(a)}}),$("body").not("input").not("textarea").keyup(function(e){18==e.which&&(t=!1)});var e,a,i=!1,r=!1,s="ontouchstart"in window?"touchmove":"mousemove",c="ontouchstart"in window?"touchend":"mouseup",l="ontouchstart"in window?"touchstart":"mousedown",u=$(n.a.instance.container).get(0).getScreenCTM();console.log(u),$(n.a.instance.container).on(l,function(t){t.preventDefault(),i=!("ontouchstart"in window)||1==t.touches.length,e="ontouchstart"in window?t.targetTouches[0].pageX:t.pageX,a="ontouchstart"in window?t.targetTouches[0].pageY:t.pageY}),$(n.a.instance.container).on(c,function(t){r&&n.a.instance.groupMarkers(n.a.instance.zoomlevel),i=!1}),$(n.a.instance.container).on(s,function(t){if(i){var o="ontouchstart"in window?t.targetTouches[0].pageX:t.pageX,s="ontouchstart"in window?t.targetTouches[0].pageY:t.pageY,c=(o-e)/-35,l=(s-a)/-35;n.a.instance.move(c,l,!1),r=!0}});var d,p=!1;$(n.a.instance.container).on("mousewheel DOMMouseScroll",function(t){if(t.preventDefault(),!p){var e="number"==typeof t.originalEvent.detail&&0!==t.originalEvent.detail?t.originalEvent.detail:t.originalEvent.wheelDelta;console.log("wheel",e),e>0?n.a.instance.resizeToLevel(n.a.instance.zoomlevel+1,!0):n.a.instance.resizeToLevel(n.a.instance.zoomlevel-1,!0),p=!0,setTimeout(function(){return p=!1},400)}});var v=!1;$(n.a.instance.container).on("touchstart",function(t){2==t.touches.length&&(v=!0,d=Math.abs(t.touches[0].pageX-t.touches[1].pageX))}),$(n.a.instance.container).not("a").on("touchmove",function(t){(t.preventDefault(),v&&!p&&2==t.touches.length)&&(Math.abs(t.touches[0].pageX-t.touches[1].pageX)>d?(n.a.instance.resizeToLevel(n.a.instance.zoomlevel+1,!0),p=!0):(n.a.instance.resizeToLevel(n.a.instance.zoomlevel-1,!0),p=!0),setTimeout(function(){return p=!1},400))})})},function(t,e,a){a(4),t.exports=a(8)},,,function(t,e,a){"use strict";a.r(e);var n=a(1),o=a(0);function i(t,e){void 0===e&&(e=!1),$.getJSON("/map/data/s/name/"+t,function(a){var o=a.results;console.log(o),$("#dataPanel").css("display","none"),$("#resultsPanel").css("display","block"),$("#resultsPanel table").empty();for(var i=1,s="Estos son los resultados para la búsqueda "+t,c=0,l=o;c<l.length;c++){var u=l[c],d=document.createElement("tr"),p=document.createElement("th"),v=document.createElement("td"),h=document.createElement("button");$(h).addClass("btn btn-success result-view").html("Ir").attr("aria-label","Ver en el mapa "+u.name+"."),$(h).attr("data-centerx",u.centerx).attr("data-centery",u.centery),$(h).attr("data-result-id",i),$(h).attr("data-feature-id",u.id),$(v).append(h),$(p).html(u.name),$(d).append(p),$(d).append(v),$("#resultsPanel table").append(d),e&&(s+="\n Resultado número "+i+": "+u.name),i++}e&&(s+="\n Selecciona un resultado para verlo en el mapa.",n.a.instance.onSearchResultSelected=function(t){var e=$(".result-view[data-result-id='"+t+"']").attr("data-centerx"),a=$(".result-view[data-result-id='"+t+"']").attr("data-centery");r($(".result-view[data-result-id='"+t+"']").attr("data-feature-id"),e,a,n.a.instance.voiceControl)},n.a.instance.voiceControl.say(s)),$("#data-status").html("Búsqueda de '"+t+"'"),$("#resultsPanel").trigger("focus"),$("button.result-view").on("click",function(t){t.preventDefault();var e=$(this).attr("data-centerx"),a=$(this).attr("data-centery");r($(this).attr("data-feature-id"),e,a)})})}function r(t,e,a,n){void 0!=e&&void 0!=a?(o.a.instance.zoomAndMove(e,a,7),s(t)):void 0!==n&&n.say("No se ha podido seleccionar ese resultado.")}function s(t){$.get("/map/data/b/"+t,function(t){for(var e in $("#dataPanel").css("display","block"),$("#resultsPanel").css("display","none"),$("#dataPanel table").empty(),t)if(t[e].userinterest){var a=document.createElement("tr"),n=document.createElement("th"),o=document.createElement("td");$(n).html(t[e].display),$(o).html(t[e].value),$(a).append(n),$(a).append(o),$("#dataPanel table").prepend(a)}})}var c=a(2);$(document).ready(function(){loadSettings(),$("form[action='']").on("submit",function(t){t.preventDefault()}),$("#pad .btn").click(function(t){t.preventDefault(),n.a.instance.navigationHandler($(this).attr("data-map-nav"))}),$("#searchform").on("submit",function(t){t.preventDefault(),i($("#queryTxt").val())}),c.a.compatible()&&($("#voicePanel").css("display","block"),n.a.instance.onSearchVoiceQuery=function(t){console.log(t),i(t,!0)},n.a.instance.onUnknownVoiceCommand=function(){n.a.instance.voiceControl.say("No te he entendido.")},n.a.instance.onRouteCommand=function(t){null!=t||(window.location.href="/route")},$("#dictateBtn").on("click",function(t){t.preventDefault(),"true"==$(this).attr("data-dictating")?(n.a.instance.stopVoice(),$(this).attr("data-dictating","false"),$(this).removeClass("active"),$("#dictateStatus").html("Haz click para comenzar a escuchar"),n.a.instance.voiceControl.say("El mapa ha dejado de escuchar.")):(n.a.instance.startVoice(),$(this).attr("data-dictating","true"),$(this).addClass("active"),$("#dictateStatus").html("Escuchando..."),n.a.instance.voiceControl.say("El mapa está ahora escuchando.")),$(this).blur()})),new MutationObserver(function(t){for(var e=0,a=t;e<a.length;e++)for(var n=0,o=a[e].addedNodes;n<o.length;n++){var i=o[n];"true"!=$(i).find("a.building-wrapper").attr("data-listened")&&($(i).find("a.building-wrapper").on("click",function(t){$(this).hasClass("non-clickable")||s($(this).attr("data-building"))}),$(i).find("a.building-wrapper").on("focus",function(t){var e=$(this).attr("data-building"),a=$(this).attr("data-coords").split(":");r(e,a[0],a[1],!1)}),$(i).find("a.building-wrapper").attr("data-listened","true"))}}).observe($(o.a.instance.container).get(0),{attributes:!1,childList:!0,subtree:!0}),new MutationObserver(function(t){for(var e=0,a=t;e<a.length;e++)for(var n=function(t){var e=$(t).find("a");"true"!=$(e).attr("data-listened")&&("group"==$(e).attr("data-type")?$(e).on("click",function(t){t.preventDefault(),o.a.instance.zoomlevel+=2,o.a.instance.zoomAndMove($(e).attr("data-x"),$(e).attr("data-y"),o.a.instance.zoomlevel)}):$(e).on("click",function(t){t.preventDefault(),r($(e).attr("data-id"),$(e).attr("data-x"),$(e).attr("data-y"),!1)}),$(e).attr("data-listened","true"))},i=0,s=a[e].addedNodes;i<s.length;i++){n(s[i])}}).observe($("#currentViewPanel ul").get(0),{attributes:!1,childList:!0,subtree:!1})})}]);