import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";

export function resolvePath(object, path) {
	/* Access nested properties from string */
	return path.split('.').reduce((o, p) => o ? o[p] : null, object);
}

// TODO: same thing as ngbDateToString
export function dateToString(date) {
	if (date?.day && date?.month && date?.year) {
		const dateString = date.year + '-' + date.month.toString().padStart(2, '0') + '-' + date.day.toString().padStart(2, '0');
		return getYYYYMMDDFromDateString(new Date(dateString).toISOString());
	} else {
		return null;
	}
}

export function stringToDate(date) {
	const dateArray = new Date(date);
	return date ? { year: dateArray.getFullYear(), month: dateArray.getMonth() + 1, day: dateArray.getDate() } : null;
}

export function dateObjToTimeString(date) {
	if (date instanceof Date) {
		return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} \
        ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
	}
	throw new Error("Date must be an instance of Date class");
}

export function anyStringToDateString(str) {
	const date = new Date(str);
	if (date) {
		return date.toISOString();
	}
	return "";
}

export function jsDateStrToString(str) {
	let retStr = "";
	if (str) {
		const date = new Date(str);
		if (date) {
			retStr = date.toISOString();
		}
	}
	return retStr;
}

export function getYYYYMMDDFromDateString(dateStr) {
	if (dateStr) {
		return dateStr.slice(0, 10);
	}
	return null;
}

export function ngbDateToString(ngbDate: NgbDateStruct): string {
	if (ngbDate) {
		return (ngbDate?.year + "-" + ngbDate?.month?.toString().padStart(2, "0") + "-" + ngbDate?.day.toString().padStart(2, "0"));
	}
	return "";
}

export function isWholeNumber(value) {
	return /^-?\d+$/.test(value);
}

export function getHeightWithoutPadding(element) {
	const computedStyle = getComputedStyle(element);
	return element.clientHeight - (parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom));
}

export function getFlagEmoji(countryCode: string) {
	if (countryCode) {
		const codePoints = countryCode
			.toUpperCase()
			.split('')
			.map((char) => 127397 + char.charCodeAt(0))
		return String.fromCodePoint(...codePoints)
	}
	return null;
}

/*

	Color Hash
	By Roland Rytz

	Generates a pseudo-random color from an input string.


	This is free and unencumbered software released into the public domain.

	Anyone is free to copy, modify, publish, use, compile, sell, or
	distribute this software, either in source code form or as a compiled
	binary, for any purpose, commercial or non-commercial, and by any
	means.

	In jurisdictions that recognize copyright laws, the author or authors
	of this software dedicate any and all copyright interest in the
	software to the public domain. We make this dedication for the benefit
	of the public at large and to the detriment of our heirs and
	successors. We intend this dedication to be an overt act of
	relinquishment in perpetuity of all present and future rights to this
	software under copyright law.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
	OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
	ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.

*/
export function colorHash2(inputString) {
	let sum = 0;

	for (const i in inputString) {
		sum += inputString.charCodeAt(i);
	}

	const r = ~~(parseFloat('0.' + Math.sin(sum + 1).toString().substr(6)) * 256);
	const g = ~~(parseFloat('0.' + Math.sin(sum + 2).toString().substr(6)) * 256);
	const b = ~~(parseFloat('0.' + Math.sin(sum + 3).toString().substr(6)) * 256);

	const rgb = "rgb(" + r + ", " + g + ", " + b + ")";

	let hex = "#";

	hex += ("00" + r.toString(16)).substr(-2, 2).toUpperCase();
	hex += ("00" + g.toString(16)).substr(-2, 2).toUpperCase();
	hex += ("00" + b.toString(16)).substr(-2, 2).toUpperCase();

	return {
		r: r
		, g: g
		, b: b
		, rgb: rgb
		, hex: hex
	};
}

/* https://stackoverflow.com/a/16533568 */
function djb2(str) {
	let hash = 2026;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
	}
	return hash;
}

/* https://stackoverflow.com/a/16533568 */
export function colorHash(str) {
	var hash = djb2(str);
	var r = (hash & 0xFF0000) >> 16;
	var g = (hash & 0x00FF00) >> 8;
	var b = hash & 0x0000FF;
	let hex = "#";

	hex += ("00" + r.toString(16)).substr(-2, 2).toUpperCase();
	hex += ("00" + g.toString(16)).substr(-2, 2).toUpperCase();
	hex += ("00" + b.toString(16)).substr(-2, 2).toUpperCase();

	return {
		r: r
		, g: g
		, b: b
		, hex: hex
	};
}

export function getTagBorderColor(str) {
	const h = colorHash(str);
	return `rgb(${h.r} ${h.g} ${h.b} / 0.05)`;
}

export function getTagBgColor(str) {
	const h = colorHash(str);
	return `rgb(${h.r} ${h.g} ${h.b} / 0.15)`;
}

// Context functions
export function searchClassValues(term, item) {
	term = term.toLocaleLowerCase();
	return item.value?.toLocaleLowerCase().indexOf(term) > -1;
}

export function sortClassValues(items) {
	const { compare } = Intl.Collator('en-GB');
	items.sort((a, b) => { return compare(a.value, b.value); });
}

export function compareIds(item1, item2): boolean {
	return item1?.id === item2?.id;
}