// title plugin
SVG.Title = SVG.invent({
    create: 'title',
    inherit: SVG.Element,
    extend: {
    text: function(text) {
            this.node.insertBefore(document.createTextNode(text), this.node.firstChild);
            return this
        } 
    },
    construct: {
        title: function(text) {
            return this.put(new SVG.Title).text(text)
        }
    }
});