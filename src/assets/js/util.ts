export function resolvePath(object, path) {
    /* Access nested properties from string */
    return path.split('.').reduce((o, p) => o ? o[p] : null, object);
}

export function dateToString(date) {
    if (date?.day && date?.month && date?.year) {
        const dateString =  date.year + '-' + date.month.toString().padStart(2, '0') + '-' + date.day.toString().padStart(2, '0');
        return new Date(dateString).toISOString().slice(0, 10);
    } else {
        return null;
    }
}

export function dateObjToTimeString(date) {
    if (date instanceof Date) {
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} \
        ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }
    throw new Error("Date must be an instance of Date class");
}

export function stringToDate(date) {
    const dateArray = new Date(date);
    return date ? {year: dateArray.getFullYear(), month: dateArray.getMonth() + 1, day: dateArray.getDate()} : null;
}

export function isWholeNumber(value) {
    return /^-?\d+$/.test(value);
}

export function getHeightWithoutPadding(element) {
    const computedStyle = getComputedStyle(element);
    return element.clientHeight - (parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom));
}