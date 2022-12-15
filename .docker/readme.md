```
docker run -it --rm -p 8080:8080 -e "USER_ID=$(id -u)" -e "GROUP_ID=$(id -g)" -v $(pwd)/snapshots:/strawman/snapshots test start -m replay -e https://openformation.io
```
