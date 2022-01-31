import * as net from 'net';

const client = new net.Socket();

const destIp = `193.114.113.23`;
const destPort = 11111;

const httpReq = `
GET /index.js HTTP/1.1
Host: ${destIp}
`;

client.connect(destPort, destIp, () => {
	console.log(`Something happened.`);
	client.write(httpReq);
	client.on('data', (data) => {
		console.log(`Received data length: ${data.length}`);
		console.log(client.remoteAddress);
		let str = data.toString();
		console.log(`Message: "${str}"`);6
	});
});