FROM oven/bun

WORKDIR /proxy

COPY ./package.json /proxy/package.json
RUN bun add .

COPY . /proxy

CMD ["bun", "run", "index.ts"]