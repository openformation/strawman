#!/usr/bin/env bash

shopt -s globstar

deno test --allow-read=$(pwd) modules/**/*.spec.ts
