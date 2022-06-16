import React from 'react';
const { googleFonts } = require('../data.json');
if (googleFonts.fonts.length === 0) {
	console.log(
		'> [nextjs-google-fonts] You dont have any google fonts in your project'
	);
}

export const GoogleFonts = () => (
	<>
		<style dangerouslySetInnerHTML={{ __html: googleFonts.style }} />
		{googleFonts.fonts.map((v) => (
			<link
				key={v}
				rel="preload"
				href={v}
				as="font"
				type="font/woff2"
				crossOrigin=""
			/>
		))}
	</>
);