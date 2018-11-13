#	JAVASCRIPT BUILD
#	Phases:
#		compile
#		Calls TypeScript compiler in order to compile the .ts files
#		into .js files
#
#		independent
#		Files in the ts/__independent folder are not meant to be bundled,
#		but to work independently as scripts loaded by the <script> tag.
#		They are copied direclty to the public/js folder for that purpose.
#
#		pack
#		The rest of the files are bundled in the way described in
#		webpack.config.js
#		Bundled files end up in the public/js/bundle folder
#

BLUE=\033[1;34m
CC=\033[0m # Clear Color

all: compile independent pack
debug: compile independent copy-debug

compile: folder-prepare
	@echo "${BLUE}Compiling TypeScript files into compiled-js/ ${CC}"
	tsc
	@echo "\n"

independent:
	@echo "${BLUE}Copying independent files to public/js ${CC}"
	cp -r compiled-js/__independent/* public/js/
	@echo "\n"

pack:
	@echo "${BLUE}Creating bundles (defined in webpack.config.js)${CC}"
	npx webpack --config webpack.config.js
	@echo "\n"

copy-debug: folder-prepare
	@echo "${BLUE}Copying compiled files to public/js for DEBUG ${CC}"
	cp -r compiled-js/* public/js/
	@echo "\n"

folder-prepare:
	@echo "${BLUE}Preparing folder structure${CC}"
	mkdir -p compiled-js/
	mkdir -p public/js
	@echo "\n"

clean:
	rm -rf /public/js
	rm -rf compiled-js