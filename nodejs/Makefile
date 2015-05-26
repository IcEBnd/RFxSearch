all: build tag push
build:
	docker build -t nodejs-rfxsearch .
tag:
	docker tag -f nodejs-rfxsearch tutum.co/icebnd/nodejs-rfxsearch
push:
	docker push tutum.co/icebnd/nodejs-rfxsearch 
run:
	docker run -p 8080:8080 -v /Users/ice/Code/rfxsearch/rfxsearch-git/nodejs/:/src/ nodejs-rfxsearch
