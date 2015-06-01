all: build tag push
build:
	docker build -t elasticsearch-rfxsearch .
tag:
	docker tag -f elasticsearch-rfxsearch tutum.co/icebnd/elasticsearch-rfxsearch
push:
	docker push tutum.co/icebnd/elasticsearch-rfxsearch
run:
	echo "nah"
