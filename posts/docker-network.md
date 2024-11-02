---
title: Docker network
published: false
date: 2024-09-30 20:07:00
tags: docker, network
description: Try to understand docker network
image: 
---



ở trong VM, iptables được sử dụng để route packet tới bridge của container

```bash
$ iptables-legacy -t nat -L DOCKER
Chain DOCKER (2 references)
target     prot opt source               destination
DNAT       tcp  --  anywhere             anywhere             tcp dpt:mysql to:172.19.0.2:3306
DNAT       tcp  --  anywhere             anywhere             tcp dpt:redis to:172.19.0.3:6379
```