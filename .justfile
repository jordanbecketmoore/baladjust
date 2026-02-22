docker-build: 
  @docker build -t baladjust . 
docker-shell: docker-build
  @docker run -it --entrypoint=/bin/sh baladjust
