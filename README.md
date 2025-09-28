# spotify-proxy

## I. Introduction
A simple proxy that echo the response the a website.

## II. Run it on your machine

+ Download [Bun.sh](https://bun.sh/)

+ Download this [repo](https://github.com/vaitosoi/simple-proxy)

+ Download dependencies:

    ```bash
    bun install
    ```

+ Run it:

    ```bash
    bun run index.ts
    ```

## III. Use it

Make a request to the proxy. Put the target url in `url` query (`/?url=<put the target url here>`). 

The proxy will make a request to the target use the method of your request, then response the response from that server.

## IV. Warning

The header is sliced. Which mean the header in your request and from server response is not included.

