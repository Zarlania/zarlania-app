#!/bin/sh
set -e
: "${PORT:=8080}"
# shellcheck disable=SC2016  # envsubst needs the literal ${PORT}, not shell expansion.
envsubst '${PORT}' </etc/nginx/nginx.conf.template >/etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
