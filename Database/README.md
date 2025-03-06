### Docker commands to get things up and running

build and start the docker container
```
sudo docker compose --env-file ../.env  up -d
```

connect to the SQL database directly to see what's goin on
```
docker exec -it mysql_container mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} > seed.sql
```


### Flask

should probably [ut something here about starting the Flask server and how it communicates with the DB

