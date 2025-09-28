import axios from "axios";
import { type Express } from "express";
import cors from "cors";
const express: () => Express = require("express");

const app = express();

app.use((request, response, next) => {
    if (!request.query.url)
        return response.status(404)
            .send("where is da url -_-?");

    next();
});
app.use(cors());

app.get("/", async (request, response) => {
    const axiosResponse = await axios.get(request.query.url!.toString(), { validateStatus: () => true });

    return response
        .status(axiosResponse.status)
        .send(axiosResponse.data);
});

app.post("/", async (request, response) => {
    const axiosResponse = await axios.post(request.query.url!.toString(), request.body, { validateStatus: () => true });

    return response
        .status(axiosResponse.status)
        .send(axiosResponse.data);
});

app.put("/", async (request, response) => {
    const axiosResponse = await axios.put(request.query.url!.toString(), request.body, { validateStatus: () => true });

    return response
        .status(axiosResponse.status)
        .send(axiosResponse.data);
});

app.delete("/", async (request, response) => {
    const axiosResponse = await axios.delete(request.query.url!.toString(), { validateStatus: () => true });

    return response
        .status(axiosResponse.status)
        .send(axiosResponse.data);
});

app.head("/", async (request, response) => {
    const axiosResponse = await axios.head(request.query.url!.toString(), { validateStatus: () => true });

    return response
        .status(axiosResponse.status)
        .send(axiosResponse.data);
});

app.options("/", async (request, response) => {
    const axiosResponse = await axios.options(request.query.url!.toString(), { validateStatus: () => true });

    return response
        .status(axiosResponse.status)
        .send(axiosResponse.data);
});

const port = process.env.PORT && !isNaN(parseInt(process.env.PORT))
    ? parseInt(process.env.PORT)
    : 7000;
const hostname = process.env.HOSTNAME && /^(\d{1,3}\.){3}\d{1,3}$/.test(process.env.HOSTNAME)
    ? process.env.HOSTNAME
    : "127.0.0.1";
const server = app.listen(port, hostname, (error) => {
    if (error)
        return console.error(error);
    console.log(`Listen on ${hostname}:${port}`);
});
server.on("error", console.error);
