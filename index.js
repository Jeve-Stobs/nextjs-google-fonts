const fs = require('fs');
const path = require('path');
const axios = require('axios');
const log = (a) => console.log('> [nextjs-google-fonts] ' + a);
const replaceValue =
	/(https?:\/\/fonts\.gstatic\.com|https?:\/\/storage\.googleapis\.com)/g;

const fetcher = async (url, prev) => {
	const { data } = await axios({
		url,
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
		},
		...prev,
	});
	return data;
};

const downloadFonts = async ({
	fonts = [],
	publicFolder = 'public',
	fontsFolder = 'fonts',
	prevent = true,
	remove = true,
}) => {
	if (fonts.length == 0) {
		log('None Google Fonts Downloaded (Array is empty)');
		return;
	}
	const publicPath = path.resolve(publicFolder);
	const fontsPath = path.join(publicPath, fontsFolder);
	const dataPath = path.join(fontsPath, 'data.json');
	const fontsArray = {};
	let styles = '';

	if (fs.existsSync(dataPath)) {
		const lastFile = fs.readFileSync(dataPath, 'utf8');
		fs.writeFileSync(path.join(__dirname, 'data.json'), lastFile);
		if (prevent) {
			const last = JSON.parse(lastFile);
			if (last.arguments.fonts.join() == fonts.join()) {
				log('(Prevent download again) - Fonts have been already saved');
				return;
			}
			if (remove) {
				fs.rmdirSync(fontsPath, { recursive: true });
			}
		}
	}

	/********* */
	for (let i = 0; i < fonts.length; i++) {
		const currentFontUrl = fonts[i];
		try {
			const data = await fetcher(currentFontUrl);
			const urls = data
				.match(/url([^)]*)/g)
				.map((v) => v.slice(4).replace(/'/g, ''));
			const newData = data
				.replace(replaceValue, `/${fontsFolder}`)
				.replace(/[\n ]/g, '');
			styles += newData;
			const prop = await Promise.all(
				urls.map((va) => fetcher(va, { responseType: 'arraybuffer' }))
			);
			for (let j = 0; j < urls.length; j++) {
				const va = urls[j];
				const name = va.replace(replaceValue, '');
				fs.mkdirSync(
					path.join(fontsPath, name.split('/').slice(0, -1).join('/')),
					{ recursive: true }
				);
				const data = prop[j];
				fs.writeFileSync(path.join(fontsPath, name), data);
				fontsArray[name] = `/${fontsFolder}${name}`;
			}
		} catch (e) {
			log(`Cannot download following font:${currentFontUrl}`);
		}
	}

	const output = {
		googleFonts: { fonts: Object.values(fontsArray), style: styles },
		arguments: {
			fonts,
			publicFolder,
			fontsFolder,
			prevent,
			remove,
		},
		buildTime: new Date().toISOString(),
	};

	const end = JSON.stringify(output, null, 2);
	try {
		fs.writeFileSync(dataPath, end);
		fs.writeFileSync(path.join(__dirname, 'data.json'), end);
		log('Successfully end!');
	} catch (error) {
		log('Something goes wrong!');
	}
};

exports.withGoogleFonts = (config) => {
	const { googleFonts } = config;
	if (!googleFonts) {
		log(`You didn't add 'googleFonts' into 'next.config.js'`);
		return config;
	}
	try {
		downloadFonts(googleFonts);
	} catch (error) {
		log('Unexpected error when downloading Google Fonts');
	} finally {
		return config;
	}
};
