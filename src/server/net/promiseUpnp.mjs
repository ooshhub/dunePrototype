import * as natuPnP from 'nat-upnp';
import request from 'request';
import { networkInterfaces } from 'os';
import { helpers } from '../../shared/helpers.mjs';

const client = natuPnP.default.createClient();
const localIp = [];

export const setupMapping = async (port, ttl) => {
	// Check port first
	let portReady = await checkPort(port);
	if (portReady) return { result: true, msg: `Port ${port} is already open, no mapping required.` }
	// Then check mappings
	else {
		if (!localIp.length) await getValidLocalIps();
		console.log(`Local IPs: ${localIp}`);
		if (!localIp.length) return { result: false, err: `Could not find a valid local IP, could not map an open port.` }
		const currentMap = await getMapping().catch(err => console.log(`Couldn't get port mappings`, err));
		console.log(currentMap);
		let isMapped;
		currentMap.forEach(pm => {
			if (localIp.includes(pm.private.host)) {
				if (pm.public.port === port) {
					isMapped = true;
				}
			}
		});
		if (isMapped) return { result: false, err: `Port is already mapped but cannot be reached.` }
		// Create new mapping as required
		else {
			console.log(`Creating new mapping...`);
			let portOpen = await newMap(port, ttl);
			if (portOpen === true) return { result: true, msg: `Port ${port} has been successfully mapped.` }
			else return { result: false, err: portOpen }
		}
	}
}

export const checkPort = async (port) => {
	return new Promise((res, rej) => {
		request.post({
			url: 'https://ports.yougetsignal.com/check-port.php',
			headers: {'content-type' : 'application/x-www-form-urlencoded'},
			body: `portNumber=${port??8080}`
		}, (err, response, data) => {
			if (err) rej(err);
			else {
				const ip = response.client._getsockname?.()?.address || null;
				if (ip) localIp.push(ip);
				let outcome = data.toString();
				if (outcome.indexOf('is open') > -1) res(1);
				else res(0);
			}
		});
	});
}

export const getMapping = async (timer=1000) => {
	return await Promise.race([
		new Promise((res, rej) => {
			client.getMappings((err, response) => {
				if (err) rej(err)
				else res(response);
			});
		}).catch(e => {
			console.log(`mapping error`, e);
			return null;
		}),
		helpers.timeout(timer)
	]);
}

export const newMap = async (port, ttl) => {
	return new Promise((res, rej) => {
		client.portMapping({
			description: 'DuneProto',
			protocol: 'tcp',
			public: port ?? 8080,
			private: port ?? 8080,
			ttl: ttl ?? 600,
		}, (err) => {
			if (err) {
				// console.log(`newMap error`, err.message);
				rej(err);
			} else {
				res(true);
			}
		});
	});
}

export const removeMap = async (port) => {
	return new Promise((res, rej) => {
		client.portUnmapping({ public: port }, (err) => {
			if (err) rej(err);
			else res(true);
		});
	})
}

export const getPublicIp = async () => {
	return new Promise((res, rej) => {
		client.externalIp((err, response) => {
			if (err) rej(err);
			else res(response);
		});
	});
}

const getValidLocalIps = async () => {
	const availableInterfaces = networkInterfaces();
	for (let intType in availableInterfaces) {
		availableInterfaces[intType].forEach(adapter => {
			if (/ipv4/i.test(adapter.family) && !adapter.internal && !localIp.includes(adapter.address)) localIp.push(adapter.address);
		});
	}
}