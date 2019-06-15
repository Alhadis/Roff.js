/**
 * @internal
 * @file Support functions used internally by {@link ManAdapter} for handling
 * compressed man-pages. Because some man(1) flavours support user-configured
 * decompression methods, we can't make assumptions based on file extensions.
 *
 * So we do things the hard way: support as many known compression formats as
 * possible, entrusting users to have the necessary decompressor installed on
 * their system.
 */
import {exec} from "../../utils/shell.mjs";
let zlib = null;


/**
 * Decompress data if it uses a supported compression format.
 *
 * Uncompressed data (or unknown formats) are returned as-is, while recognised
 * formats are piped through an external decompression utility. E.g., bzipped
 * data will use bunzip2(1), lzip(1) data would call `lzip -d`, and so forth.
 *
 * @see {ManAdapter}
 * @param {Buffer} input - Raw bytestream
 * @return {Buffer}
 * @internal
 */
export async function unzip(input){
	input = Buffer.from(input);

	// Gzipped
	if(0x1F === input[0] && 0x8B === input[1])
		return unzipZlib(input);

	// ZLIB/Deflate header
	if(!((256 * input[0] + input[1]) % 31)
		&& 8 === (input[0] & 0x0F)
		&& 0 === (input[0] & 0x80))
		try{ return unzipZlib(input); }
		catch(e){ }

	// External utility
	const [cmd, ...args] = getDecompressor(input);
	if(cmd){
		const result = await exec(cmd, args, input, "", ["binary", "utf8"]);
		if(result.code){
			const error = new Error(result.stderr || `${cmd} exited with error ${result.code}`);
			throw Object.assign(error, {
				[Symbol.toStringTag]: "ExecutionError",
				executable: {name: cmd, args},
			});
		}
		return result.stdout;
	}
	
	// Return original input if no decompression was used/needed
	return input;
}


/**
 * Decompress gzipped or deflated data using Node's native ZLIB support.
 * 
 * @param {Buffer} input
 * @return {Buffer}
 * @internal
 */
export async function unzipZlib(input){
	if(null === zlib)
		zlib = await import("zlib");
	return new Promise((resolve, reject) => {
		zlib.unzip(input, (error, input) => error
			? reject(error)
			: resolve(input));
	});
}


/**
 * Identify the command needed to decompress data, if any.
 *
 * @example getDecompressor("LZIP") == ["lzip", "-d"];
 * @param {Buffer} input - Bytestream to examine headers of
 * @return {String[]}
 * @internal
 */
export function getDecompressor(input){
	
	// Standard Unix compress(1)
	if(0x1F === input[0] && 0x9D === input[1])
		return ["uncompress"];

	// Bzip2
	else if(0x42 === input[0] && 0x5A === input[1])
		switch(input[2]){
			case 0x30: return ["bunzip"];
			case 0x68: return ["bunzip2"];
		}

	// LZIP/LRZIP
	const i4 = input.slice(0, 4);
	switch(i4.toString()){
		case "LZIP": return ["lzip", "-d"];
		case "LRZI": return ["lrzip", "-qdf"];
	}

	// LZMA/XZ compressed data
	if(0x5D === input[0] && [0x00, 0xFF].includes(input[12])
	|| i4.equals(new Uint8Array([0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00])))
		return ["xz", "-d"];

	// LZ4 compressed data
	else if(
		0x4D === input[2] && 0x18 === input[3] && (
		0x04 === input[0] && 0x22 === input[1] ||
		0x21 === input[1] && [0x02, 0x03].includes(input[0])
	)) return ["lz4", "-d"];

	// Facebook's Zstandard/ZSTD
	else if(i4.equals(new Uint8Array([0x28, 0xB5, 0x2F, 0xFD])))
		return ["zstd", "-d"];

	// QuickLZ (implemented by qpress10)
	else if("qpress10" === input.slice(0, 8).toString())
		return ["qpress", "-dio"];

	// Apple's lzfse
	else if(
		0x62 === input[0] &&
		0x76 === input[1] &&
		0x78 === input[2] &&
		[0x2D, 0x31, 0x32, 0x6E].includes(input[3])
	) return ["lzfse", "-decode"];

	return [];
}
