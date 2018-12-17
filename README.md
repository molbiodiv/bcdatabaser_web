# About

Web interface for executing the pipeline [metaDB](https://github.com/molbiodiv/metabDB)

## Docker setup
### Prerequisites
- [docker](https://docs.docker.com/)
- [docker-compose](https://docs.docker.com/compose/)

### Clon source code and initialize containers
```{bash}
git clone https://github.com/sonjahohlfeld/metaDB_web.git --recursive
cd metaDB_web/docker
docker-compose up -d
```

Point your browser to [http://localhost:3000](http://localhost:3000) and you get access to the web interface.
