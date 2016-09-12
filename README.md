# 环境搭建

- Install Docker: curl -sSL https://get.docker.com/ | sh
- git clone https://github.com/cheuka/dota.git
- cd dota
- sudo docker run -d --name postgres --net=host postgres:9.5
- sudo docker run -d --name redis --net=host redis:3
- sudo docker pull lpeter83/cheuka-dota:1.0  (if any network problem, refer to https://www.daocloud.io/mirror#accelerator-doc)

- sudo docker start redis 
- sudo docker start postgres

- sudo docker exec -i postgres psql -U postgres < sql/init.sql
- sudo docker exec -i postgres psql -U postgres yasp < sql/create_tables.sql


# Run dota

- if docker service not started, ```sudo service docker start```
- create docker container based on the image cheuka-dota:1.0,  ```sudo docker run -dit --name dota --net=host lpeter83/cheuka-dota:1.0```
- enter the dota container, ```sudo docker exec -it dota bash```
- to start dota application, just run ```pm2 start debug.json``` in the container bash env
