# Quick Overview

This repo is my attempt at trying to build an API framework that feels right to me. The framework is generally typesafe. It doesn't provide access to underlying server (koa).

Request validation is currently done through zod, it may be abstracted later to be able to use a generic validation interface instead.

Koa is used as the server (with koa router and body parser), however it would be fairly easy to use express or some other basic parsing and routing system.

src/lib contains what would constitute the library part of this framework. Everything else is a demonstration of how it would be used (./infra, ./routes, ./utils and main.ts are all application specific).
