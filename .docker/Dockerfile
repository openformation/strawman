FROM denoland/deno:1.25.4

COPY . /app
COPY .docker/strawman /usr/local/bin/strawman

RUN deno cache /app/modules/strawman-cli/cli.ts \
  && chmod go+rwx /usr/local/bin/strawman

WORKDIR /app

ENTRYPOINT ["strawman"]
