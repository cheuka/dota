# 环境搭建

- Install Docker: curl -sSL https://get.docker.com/ | sh
- git clone https://github.com/cheuka/dota.git
- cd dota
- sudo docker run -d --name postgres --net=host postgres:9.5
- sudo docker run -d --name redis --net=host redis:3
- sudo docker pull lpeter83/cheuka-dota:1.0

- sudo docker exec -i postgres psql -U postgres < sql/init.sql
- sudo docker exec -i postgres psql -U postgres yasp < sql/create_tables.sql



# run dota

to start the application, just run as follows:

  pm2 start debug.json
