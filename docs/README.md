# PeerMeeting documentation

- [PeerMeeting documentation](#peermeeting-documentation)
  - [Getting started](#getting-started)
    - [Configuration](#configuration)
      - [Configure container](#configure-container)
      - [Configure not in container](#configure-not-in-container)
    - [Docker compose](#docker-compose)
    - [Docker Swarm](#docker-swarm)

## Getting started
For the application to work, several conditions must be met:
1. If the application will be launched locally, then aspnetcore 3.1 runtime must be installed
2. There must be a reverse proxy to establish an https connection
3. If you hav to scale service, you need Redis (*version >=6 with acl user who can create/pub/sub channels with prefix `peermeeting`*)

Next, you need to choose a launch method. It is possible to launch the application:
1. Run the executable file locally
2. Run in docker
   1. Using docker compose
   2. Using docker swarm
   

### Configuration

#### Configure container
For configuring you need add environment variable.   
Available configurations:
1. `Serilog:MinimumLevel:Default` - configuring logger minimum level
2. `Redis:Enabled` - enable/disable (default false) redis connection. Need for scale service
3. `Redis:ConnectionString` - connection string to redis. (example: `localhost,user=serviceuser,password=VeryHardPass,channelPrefix=peermeeting`)

#### Configure not in container
To configure configurations, you need to make changes to `appsettings.Production.json`. The list of settings is identical to that described in the "Configure container" block.

### Docker compose

For an example of launching via docker compose, a [compose file](compose.yml) has been prepared with a description of starting the service and nginx with a self-signed certificate for quick launch **(For test use only)**.

In this example, nginx proxies traffic to the application over the internal network. To use an external proxy, you just need to expose the application to the outside by adding the port `ports:"30005:80"` to the compose file. An example of a proxying configuration for [nginx is here](nginx/conf.d/nginx_default.conf).

Compose file:
```yaml
version: '3.8'

services:
  peer-meeting:
    image: eluki/peer-meeting
    
  nginx:
    image: nginx:latest
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
```

To run the application, you need to run:
```
docker-compose up
```

### Docker Swarm

You can use the prepared swarm.yml to run in Docker Swarm. The configuration does not use nginx because it is preferable to use an external proxy to create an https connection.

```yaml
version: '3.8'

services:
  host:
    image: eluki/peer-meeting
    ports:
     - target: 80
       published: 30005
       protocol: tcp
       mode: host
    deploy:
      replicas: 1
      update_config:
        parallelism: 1
        delay: 10s
        order: stop-first
      placement:
        max_replicas_per_node: 1
    logging:
      driver: "json-file"
      options:
        max-size: "3m"
        max-file: "3"
```

To deploy the application, you need to run:
```
docker stack deploy -c swarm.yml peer-meeting
```