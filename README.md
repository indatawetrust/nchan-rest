# nchan-rest
Rest api for nchan

```bash
git clone git@github.com:indatawetrust/nchan-rest.git

docker-compose up -d

npm i -g http-server && http-server demo
```

and demo: http://localhost:8080

- [x] jwt support
- [x] POST /message/:id
- [x] DELETE /message/:id
- [x] DELETE /room/:id
- [x] GET /message/:id?page=1
- [x] GET /messages?page=1
- [x] POST /join
- [x] GET /leave
- [x] POST /info/:id
- [x] GET /read/:id
