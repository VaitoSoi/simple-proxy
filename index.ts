import axios from "axios";
import { type Express } from "express";
import cors from "cors";
import dns from 'node:dns/promises';
import net from 'node:net';
import { isIpAllowed } from "./utils";
const express: () => Express = require("express");

const app = express();

function isPrivateIP(ip: string) {
    return (
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("172.") && (() => {
            const second = parseInt(ip.split(".")[1]!, 10);
            return second >= 16 && second <= 31;
        })() ||
        ip.startsWith("127.") ||
        ip === "0.0.0.0" ||
        ip.startsWith("169.254.") ||
        ip === "::1"
    );
}

app.use(async (request, response, next) => {
    try {
        const target = request.query.url;
        if (!target)
            return response.status(404)
                .json({ error: "No URL", message: "where is da url -_-?" });

        let parsed;
        try {
            parsed = new URL(String(target));
        } catch (err) {
            return response.status(400).json({ error: 'Invalid URL', message: 'what is dat? its not an url.', advice: 'do u forget your protocol ._.?' });
        }

        const hostname = parsed.hostname;
        if (hostname.includes(':'))
            return response.status(403).json({ error: 'IPv6 targets are not allowed', message: 'no ipv6 >:(' });

        let lookupResponseds;
        try {
            lookupResponseds = await dns.lookup(hostname, { all: true });
        } catch (err) {
            return response.status(400).json({ error: 'Cannot resolve hostname', message: 'where is da host? i cant see it -_-' });
        }

        for (const lookupResponse of lookupResponseds) {
            // Use net.isIP to be robust (returns 4 for IPv4, 6 for IPv6, 0 for invalid)
            const address = lookupResponse.address;
            const ipFamily = net.isIP(lookupResponse.address);
            if (ipFamily === 0)
                return response.status(403).json({ error: 'Blocked malformed/unknown address', message: 'what is dat url? i dont know it >:(' });
        
            if (!isIpAllowed(address))
                return response.status(403).json({ error: 'Target IP is a internal IP or an error occured while parsing IP', message: 'no local IP >:(' });
        }

        next();
    } catch (error) { 
        console.error(error);

    }
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
