#!/usr/bin/env bash

shopt -s globstar

deno test --allow-read=$(pwd) --allow-write=$(pwd) --unstable modules/**/*.spec.ts
