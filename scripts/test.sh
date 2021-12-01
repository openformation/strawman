#!/usr/bin/env bash

shopt -s globstar

deno test modules/**/*.spec.ts
