/*
    Encapsulates a message, including its name
    and its contents
*/

class Message {
    /*
        Two usages:
            · For parsing from JSON:
                constructor(json_string);

                Declare contents as null to avoid
                this behaviour.

            · For building from separate strings
                constructor(name_string, contents_string)
    */
    constructor(name, contents) {
        if (typeof contents == 'undefined') {
            let values = JSON.parse(name.json);
            let _name = values.name;
            let _contents = values.contents;

            this.getName = function() { return _name; }
            this.getContents = function() { return _contents; }

            this.setName = function(v) { _name = name; }
            this.setContents = function(v) { _contents = contents; }

            return this;
        } else {
            let _name = name;
            let _contents = contents;

            this.getName = function() { return _name; }
            this.getContents = function() { return _contents; }

            this.setName = function(v) { _name = name; }
            this.setContents = function(v) { _contents = contents; }

            return { json: this.toString() }
        }
    }

    toJSON() {
        return {
            name: this.getName(),
            contents: this.getContents()
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}