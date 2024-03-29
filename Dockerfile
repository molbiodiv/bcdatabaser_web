FROM iimog/bcdatabaser
ARG BRANCH=master
LABEL maintainer="markus.ankenbrand@uni-wuerzburg.de"

RUN apt-get update \
&& apt-get install -yq git unzip vim curl wget build-essential cron\
&& rm -rf /var/lib/apt/lists/*
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get update \
&& apt-get install -yq nodejs

COPY . /bcdatabaser
RUN cd /bcdatabaser && npm install

WORKDIR /bcdatabaser
ENTRYPOINT []
EXPOSE 3000
CMD ["npm", "start"]
