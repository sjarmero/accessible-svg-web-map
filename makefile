all: compile pack

compile:
	tsc

pack:
	npx webpack --config webpack.config.js