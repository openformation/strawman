# strawman- Proof of concept

Currently, this proof of concept shows how snapshots can be created in capture mode.

To test this, you can run the following command:

```sh
deno run --allow-net --allow-read --allow-write --unstable mod.ts capture --prefix http://localhost:8080 --target https://openformation.io out
```

And then run:

```sh
curl http://localhost:8080/
```


You'll see, that an `out` directory is being created and populated with snapshots.

The second time you run

```sh
curl http://localhost:8080/
```

the response will be delivered from the saved snapshots.

There is also a `replay` mode, in which only the captured responses will be emitted and no communication with the external service takes place:

```sh
deno run --allow-net --allow-read --allow-write --unstable mod.ts replay --prefix http://localhost:8080 out
```
