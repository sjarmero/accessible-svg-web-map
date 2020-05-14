FROM ubuntu:18.04

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir /opt/map

COPY . /opt/map

RUN echo "Europe/Madrid" > /etc/timezone

RUN apt-get update -q --fix-missing && \
    apt-get -y upgrade && \
    apt-get -y install wget \
			gnupg2

RUN echo "deb http://apt.postgresql.org/pub/repos/apt bionic-pgdg main" > /etc/apt/sources.list.d/postgres.list
RUN wget --quiet -O - http://apt.postgresql.org/pub/repos/apt/ACCC4CF8.asc | apt-key add -

RUN apt-get update -q --fix-missing && \
    apt-get -y install \
		build-essential \
		sudo \
		curl \
        nginx \
		lsb-release \
		postgresql-10 \
		postgresql-10-postgis-2.4 \
		postgresql-10-postgis-2.4-scripts \
		postgresql-10-pgrouting && \
    apt-get autoremove -y && \
    apt-get autoclean

ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

EXPOSE 8080

RUN /opt/map/scripts/install.sh

CMD /opt/map/scripts/docker-entrypoint.sh

